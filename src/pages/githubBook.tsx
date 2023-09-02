import {
  Alert,
  Button,
  Checkbox,
  Code,
  Container,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { type NextPage } from 'next';
import { useEffect } from 'react';
import CustomError from '~/components/Error';
import { api, type RouterInputs } from '~/utils/api';

type BookFormValues = Omit<RouterInputs['repoTools']['fetchContents'], 'token'>;

const Home: NextPage = () => {
  const fetchContentsMutate = api.repoTools.fetchContents.useMutation();
  const repoFetch = api.repoTools.repoFetch.useMutation();
  const form = useForm({
    initialValues: {
      token: '',
    },
  });

  const bookForm = useForm<BookFormValues>({
    initialValues: {
      path: '',
      hideDirs: true,
      selectedRepo: 'ickynavigator/github-book',
      branch: '',
      acceptableFileTypes: '',
    },

    validate: {
      selectedRepo: value =>
        value.length > 0 ? false : 'Please select a repository',
      acceptableFileTypes: value => {
        if (!value) return null;

        const types = value.split(',').map(type => type.trim());

        if (types.some(type => !type)) return 'File types cannot be empty';
      },
    },
  });

  useEffect(() => {
    if (repoFetch.data) {
      const branch = repoFetch.data.find(
        repo => repo.name === bookForm.values.selectedRepo,
      )?.default_branch;

      if (branch) {
        bookForm.setFieldValue('branch', branch);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookForm.values.selectedRepo, repoFetch.data]);

  return (
    <Container py="xl">
      <Title>Dir List</Title>
      <Stack>
        <form onSubmit={form.onSubmit(values => repoFetch.mutate(values))}>
          <Stack>
            <TextInput
              withAsterisk
              label="Token"
              placeholder="Github Token"
              description={
                <Text>
                  Token should have <Code color="grape">repo</Code>
                </Text>
              }
              {...form.getInputProps('token')}
            />
            <Group position="right">
              <Button type="submit" loading={repoFetch.isLoading}>
                Submit
              </Button>
            </Group>
            {repoFetch.isError && (
              <CustomError message={repoFetch.error.message} />
            )}
          </Stack>
        </form>

        {repoFetch.data != undefined && (
          <form
            onSubmit={bookForm.onSubmit(values =>
              fetchContentsMutate.mutate({
                ...values,
                token: form.values.token,
              }),
            )}
          >
            <Stack>
              <Select
                withAsterisk
                label="Repository to update"
                placeholder="Pick one"
                data={repoFetch.data.map(repo => repo.name)}
                {...bookForm.getInputProps('selectedRepo')}
              />
              <TextInput
                withAsterisk
                label="Branch to fetch"
                {...bookForm.getInputProps('branch')}
              />
              <TextInput
                mt="md"
                label="Path"
                placeholder="Enter base path"
                {...bookForm.getInputProps('path')}
              />
              <TextInput
                mt="md"
                label="File types (seperated by comma)"
                placeholder=".md,.txt"
                {...bookForm.getInputProps('acceptableFileTypes')}
              />
              <Checkbox
                mt="md"
                label="Hide directories"
                {...bookForm.getInputProps('hideDirs', { type: 'checkbox' })}
              />
              <Group position="right" mt="md">
                <Button type="submit" loading={fetchContentsMutate.isLoading}>
                  Submit
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Stack>

      <Paper shadow="xl" radius="md" p="xl" my="lg" withBorder>
        {fetchContentsMutate.isLoading ? (
          <Loader />
        ) : (
          <ScrollArea scrollHideDelay={500}>
            {fetchContentsMutate.data && (
              <pre>{JSON.stringify(fetchContentsMutate.data, null, 4)}</pre>
            )}

            {!fetchContentsMutate.data && !fetchContentsMutate.isError && (
              <Text align="center">NO DATA FOUND YET</Text>
            )}

            {fetchContentsMutate.isError && (
              <Alert title="Bummer" color="red">
                An Error occured while fetching data. Please try again later.
              </Alert>
            )}
          </ScrollArea>
        )}
      </Paper>
    </Container>
  );
};

export default Home;
