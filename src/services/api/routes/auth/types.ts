interface IResponseSignIn {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

interface IResponseSignup {
  message: string;
}
