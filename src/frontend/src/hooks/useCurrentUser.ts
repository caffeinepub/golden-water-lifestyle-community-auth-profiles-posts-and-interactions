import { useInternetIdentity } from './useInternetIdentity';
import { useGetCallerUserProfile } from './useQueries';

export function useCurrentUser() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const principal = isAuthenticated ? identity?.getPrincipal().toString() : undefined;

  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  return {
    identity,
    isAuthenticated,
    principal,
    userProfile,
    profileLoading,
    isFetched,
  };
}
