import { Avatar } from '@mui/material';

export default function TeamAvatar({
  member,
  size = 72,
  compact = false,
  sx = {},
  ...props
}) {
  const dimension = compact ? 48 : size;

  return (
    <Avatar
      src={member.photo || undefined}
      alt={member.name}
      imgProps={{ loading: 'lazy' }}
      sx={{
        width: dimension,
        height: dimension,
        mx: compact ? 0 : 'auto',
        mb: compact ? 1.5 : 2,
        bgcolor: 'primary.main',
        color: 'secondary.main',
        fontWeight: 700,
        fontSize: compact ? '1rem' : dimension >= 100 ? '2.5rem' : '1.5rem',
        border: dimension >= 100 ? 3 : 2,
        borderColor: 'secondary.main',
        ...sx,
      }}
      {...props}
    >
      {member.initials}
    </Avatar>
  );
}
