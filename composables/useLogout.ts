import { getAuth } from "firebase/auth";

export const useLogout = () => {
  const user = useUserStore();
  const auth = getAuth();

  const logout = async () => {
    await auth.signOut();
    user.logout();
    navigateTo("/login");
  };

  return { logout };
};
