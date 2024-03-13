interface ISignIn {
  username: string;
  password: string;
}

interface IResponseSignIn {
  token: string;
  user: {
    id: string;
    username: string;
  };
}
