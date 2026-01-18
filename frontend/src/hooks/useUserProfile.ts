import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, updateUserProfile } from "@/lib/api/client";
import { authClient } from "@/lib/auth";

export interface UserProfile {
  name: string;
  age: number | string;
  about: string;
  preferredGenres: string[];
  preferredMoods: string[];
  likedSongIds: string[];
}

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  age: "",
  about: "",
  preferredGenres: [],
  preferredMoods: [],
  likedSongIds: [],
};

export function useUserProfile() {
  const queryClient = useQueryClient();
  const session = authClient.useSession();
  const isAuthenticated = !!session.data;

  // Fetch profile from API
  const {
    data: profile = DEFAULT_PROFILE,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
    enabled: isAuthenticated,
    staleTime: 30000, // 30 seconds
  });

  // Mutation to update profile
  const updateMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updatedProfile) => {
      // Update the cache with the new profile
      queryClient.setQueryData(["userProfile"], updatedProfile);
    },
  });

  const updateProfile = (updates: Partial<UserProfile>) => {
    // Merge current profile with updates
    const updatedProfile = { ...profile, ...updates };
    updateMutation.mutate(updatedProfile);
  };

  const toggleLikedSong = (songId: string) => {
    const isLiked = profile.likedSongIds.includes(songId);
    const updatedLikedSongIds = isLiked
      ? profile.likedSongIds.filter((id) => id !== songId)
      : [...profile.likedSongIds, songId];
    
    updateProfile({ likedSongIds: updatedLikedSongIds });
  };

  return {
    profile,
    updateProfile,
    toggleLikedSong,
    isLoading,
    error,
    isUpdating: updateMutation.isPending,
  };
}
