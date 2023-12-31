import {
  ActionIcon,
  Anchor,
  Navbar,
  Text,
  createStyles,
  getStylesRef,
  rem,
  type ActionIconProps,
  type CSSObject,
  type NavbarProps,
} from '@mantine/core';
import { IconBook, IconBrandGithub } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

const useStyles = createStyles(theme => ({
  footer: {
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderTop: `${rem(1)} solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[2]
    }`,
  },

  link: {
    ...(theme.fn.focusStyles() as Record<string, CSSObject>),
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    fontSize: theme.fontSizes.sm,
    color:
      theme.colorScheme === 'dark'
        ? theme.colors.dark[1]
        : theme.colors.gray[7],
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    borderRadius: theme.radius.sm,
    fontWeight: 500,

    '&:hover': {
      backgroundColor:
        theme.colorScheme === 'dark'
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
      color: theme.colorScheme === 'dark' ? theme.white : theme.black,

      [`& .${getStylesRef('icon')}`]: {
        color: theme.colorScheme === 'dark' ? theme.white : theme.black,
      },
    },
  },

  linkIcon: {
    ref: getStylesRef('icon'),
    color:
      theme.colorScheme === 'dark'
        ? theme.colors.dark[2]
        : theme.colors.gray[6],
    marginRight: theme.spacing.sm,
  },

  linkActive: {
    '&, &:hover': {
      backgroundColor: theme.fn.variant({
        variant: 'light',
        color: theme.primaryColor,
      }).background,
      color: theme.fn.variant({ variant: 'light', color: theme.primaryColor })
        .color,
      [`& .${getStylesRef('icon')}`]: {
        color: theme.fn.variant({ variant: 'light', color: theme.primaryColor })
          .color,
      },
    },
  },
}));

type ILink = {
  link: string;
  label: string;
  icon: (props: ActionIconProps) => JSX.Element;
};
const data: ILink[] = [
  {
    link: 'repoAddCollaborators',
    label: 'Add Github Collaborators',
    icon: (props: ActionIconProps) => (
      <ActionIcon {...props}>
        <IconBrandGithub stroke={2} />
      </ActionIcon>
    ),
  },
  {
    link: 'githubBook',
    label: 'Github Book',
    icon: (props: ActionIconProps) => (
      <ActionIcon {...props}>
        <IconBook stroke={2} />
      </ActionIcon>
    ),
  },
];

const GITHUB = 'https://github.com/ickynavigator/github-tools';

const CustomNavbar = (props: Omit<NavbarProps, 'children'>) => {
  const { classes, cx } = useStyles();
  const [active, setActive] = useState('');

  useEffect(() => {
    if (typeof window == undefined) return;

    const currPath = window.location.pathname.slice(1).toLowerCase();
    setActive(currPath);
  }, []);

  const links = data.map(item => (
    <a
      className={cx(classes.link, {
        [classes.linkActive]: item.link.toLowerCase() === active,
      })}
      href={item.link}
      key={item.label}
    >
      <item.icon className={classes.linkIcon} />
      <span>{item.label}</span>
    </a>
  ));

  return (
    <Navbar p="md" {...props}>
      <Navbar.Section grow>{links}</Navbar.Section>

      <Navbar.Section className={classes.footer}>
        <Text align="center">Built with ❤️</Text>
        <Text align="center">
          <Anchor href={GITHUB} target="_blank">
            SOURCE CODE
          </Anchor>
        </Text>
      </Navbar.Section>
    </Navbar>
  );
};

export default CustomNavbar;
