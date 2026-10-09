import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
export const createUser = async (email: string, password: string) => {
  const auth = getAuth();
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential;
};

export const loginUser = async (email: string, password: string) => {
  const auth = getAuth();
  const userstore = useUserStore();
  // console.log(email, password)
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      userstore.setUser(userCredential.user);
      // console.log(userCredential)
      return userCredential;
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      // console.log(errorCode, errorMessage)
    });
  return userCredential;
};

export const resetpass = async (email: string) => {
  const auth = getAuth();
  return sendPasswordResetEmail(auth, email)
    .then(() => {
      useUserStore().setUser(null);
      return "ok";
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      return errorMessage;
      // ..
    });
};
export const signOut = async () => {
  const auth = getAuth();
  const userCredential = await auth.signOut();
  useUserStore().setUser(null);
  navigateTo("/login");
  sessionStorage.clear();
  return userCredential;
};

export const initUser = async () => {
  const auth = getAuth();
  return onAuthStateChanged(auth, async (user) => {
    return await useUserStore().setUser(user);
  });
};
