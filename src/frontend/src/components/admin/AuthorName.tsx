import { Principal } from '@dfinity/principal';
import { useGetUsernameFromPrincipal } from '../../hooks/useQueries';

interface AuthorNameProps {
  principal: Principal;
}

export default function AuthorName({ principal }: AuthorNameProps) {
  const { data: username, isLoading } = useGetUsernameFromPrincipal(principal);

  if (isLoading) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  if (username) {
    return <span className="font-semibold">{username}</span>;
  }

  // Fallback to shortened principal
  const principalStr = principal.toString();
  const shortened = `${principalStr.slice(0, 8)}...${principalStr.slice(-6)}`;
  
  return (
    <span className="font-mono text-sm text-muted-foreground" title={principalStr}>
      {shortened}
    </span>
  );
}
