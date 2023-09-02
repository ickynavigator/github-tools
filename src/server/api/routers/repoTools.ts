import { Octokit } from '@octokit/rest';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

const SelectedRepo = z.string().refine(
  value => {
    const [owner, repo] = value.split('/');
    return owner != undefined && repo != undefined;
  },
  { message: 'Invalid repository name' },
);

export const repoToolsRouter = createTRPCRouter({
  repoFetch: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const octokit = new Octokit({ auth: input.token });

      let repos: {
        name: string;
        default_branch: string;
      }[] = [];
      const URL = 'GET /user/repos';

      for await (const response of octokit.paginate.iterator(URL)) {
        repos = repos.concat(
          response.data.map(r => ({
            name: `${r.owner.login}/${r.name}`,
            default_branch: r.default_branch,
          })),
        );
      }

      return repos;
    }),
  addUsers: publicProcedure
    .input(
      z.object({
        selectedRepo: SelectedRepo,
        users: z.array(z.string()),
        token: z.string(),
        permission: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { permission } = input;

        const octokit = new Octokit({ auth: input.token });
        const [owner, repo] = input.selectedRepo.split('/');

        if (owner == undefined || repo == undefined) {
          throw new Error('Invalid repository name');
        }

        const handleCollaboratorAdd = async (username: string) => {
          return await octokit.rest.repos.addCollaborator({
            owner,
            repo,
            username,
            permission,
          });
        };

        await Promise.all(input.users.map(handleCollaboratorAdd));
      } catch (error) {
        console.error(error);

        if (
          error != null &&
          typeof error == 'object' &&
          'message' in error &&
          typeof error.message == 'string'
        ) {
          throw new Error(error.message);
        }

        throw new Error('An unknown error occurred');
      }
    }),
  fetchContents: publicProcedure
    .input(
      z.object({
        selectedRepo: SelectedRepo,
        token: z.string(),
        acceptableFileTypes: z.string().optional(),
        hideDirs: z.boolean().optional(),
        path: z.string().optional(),
        branch: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { token, branch, selectedRepo, hideDirs, acceptableFileTypes } =
        input;
      const [owner, repo] = selectedRepo.split('/');

      if (owner == undefined || repo == undefined) {
        throw new Error('Invalid repository name');
      }

      const octokit = new Octokit({ auth: token });

      const {
        data: {
          commit: { sha },
        },
      } = await octokit.rest.repos.getBranch({
        owner,
        repo,
        branch,
      });

      const res = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: sha,
        recursive: 'true',
      });

      type FileStruct = Record<string, { files: string[]; dirs?: string[] }>;

      const tree = res.data.tree.reduce<FileStruct>((acc, item) => {
        const { path, type } = item;
        if (path == undefined || type == undefined) return acc;

        const pathParts = path.split('/');
        if (pathParts == undefined) return acc;

        const fileName = pathParts.pop();
        if (fileName == undefined) return acc;

        const dirPath = pathParts.join('/');
        const dir = acc[dirPath] ?? (acc[dirPath] = { files: [], dirs: [] });

        if (type === 'blob') {
          if (acceptableFileTypes) {
            const fileTypes = acceptableFileTypes
              .split(',')
              .map(type => type.trim())
              .map(type => type.replace(/^\./, ''));
            const fileType = fileName.split('.').pop();

            if (!fileType || !fileTypes.includes(fileType)) {
              return acc;
            }
          }

          dir.files.push(fileName);
        }

        if (type === 'tree') dir.dirs?.push(fileName);

        return acc;
      }, {});

      Object.keys(tree).forEach(key => {
        if (tree[key]?.files.length === 0) delete tree[key];
      });

      if (hideDirs) Object.keys(tree).forEach(key => delete tree[key]?.dirs);

      return tree;
    }),
});
