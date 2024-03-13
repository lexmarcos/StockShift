export interface IResponseGetProducts {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  categories: string[];
  attributes: {
    [key: string]: string;
  };
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}
