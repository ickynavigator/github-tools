import {
  Alert,
  Button,
  Checkbox,
  Container,
  Group,
  Loader,
  Paper,
  ScrollArea,
  SimpleGrid,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { type NextPage } from 'next';
import { useState } from 'react';
import { api, type RouterInputs, type RouterOutputs } from '~/utils/api';

type FetchContentsType = {
  out: RouterOutputs['repoTools']['fetchContents'];
  in: RouterInputs['repoTools']['fetchContents'];
};

const Home: NextPage = () => {
  const [dirs, setDirs] = useState<FetchContentsType['out']>();

  const fetchContentsMutate = api.repoTools.fetchContents.useMutation();

  const form = useForm<FetchContentsType['in']>({
    initialValues: {
      owner: 'ickynavigator',
      repo: 'github-book',
      path: '',
      hideDirs: true,
      fileTypes: '',
    },

    validate: {
      owner: value => {
        if (!value) return 'Owner is required';
      },
      repo: value => {
        if (!value) return 'Repository is required';
      },
      fileTypes: value => {
        if (!value) return null;

        const types = value.split(',').map(type => type.trim());

        if (types.some(type => !type)) return 'File types cannot be empty';
      },
    },
  });

  const onSubmit = async (values: FetchContentsType['in']) => {
    const res = await fetchContentsMutate.mutateAsync(values);

    if (!fetchContentsMutate.isError) {
      setDirs(res);
    }
  };

  return (
    <Container py="xl">
      <form
        onSubmit={form.onSubmit(values => {
          void onSubmit(values);
        })}
      >
        <Title
          order={2}
          size="h1"
          sx={theme => ({ fontFamily: `Greycliff CF, ${theme.fontFamily}` })}
          weight={900}
          align="center"
        >
          Dir List
        </Title>
        <SimpleGrid
          cols={2}
          mt="xl"
          breakpoints={[{ maxWidth: 'sm', cols: 1 }]}
        >
          <TextInput
            withAsterisk
            label="Owner"
            placeholder="Enter github repository owner name"
            {...form.getInputProps('owner')}
          />
          <TextInput
            withAsterisk
            label="Repository"
            placeholder="Enter github repository name"
            {...form.getInputProps('repo')}
          />
        </SimpleGrid>
        <TextInput
          mt="md"
          label="Path"
          placeholder="Enter base path"
          {...form.getInputProps('path')}
        />
        <TextInput
          mt="md"
          label="File types (seperated by comma)"
          placeholder=".md,.txt"
          {...form.getInputProps('fileTypes')}
        />
        <Checkbox
          mt="md"
          label="Hide directories"
          {...form.getInputProps('hideDirs', { type: 'checkbox' })}
        />
        <Group position="right" mt="md">
          <Button type="submit" loading={fetchContentsMutate.isLoading}>
            Submit
          </Button>
        </Group>
      </form>

      <Paper shadow="xl" radius="md" p="xl" my="lg" withBorder>
        {fetchContentsMutate.isLoading ? (
          <Loader />
        ) : (
          <ScrollArea scrollHideDelay={500}>
            {dirs && <pre>{JSON.stringify(dirs, null, 4)}</pre>}

            {!dirs && !fetchContentsMutate.isError && (
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
