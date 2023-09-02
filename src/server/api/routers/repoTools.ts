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
        fileTypes: z.string().optional(),
        hideDirs: z.boolean().optional(),
        path: z.string().optional(),
      }),
    )
    .mutation(() => {
      return {};
    }),
});
