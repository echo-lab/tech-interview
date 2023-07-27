import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="p-20">
      <h1 className="text-5xl font-bold">Oops!</h1>
      <p className="text-xl mt-2.5">Something went wrong</p>
      <p className="mt-5">
        <i>{error.status} </i>
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  );
}