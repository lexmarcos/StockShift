import { Card } from "@/components/ui/card";
import Image from "next/image";
import AuthForm from "../components/authForm";
import Link from "next/link";

function Signin() {
  return (
    <div className="grid w-full">
      <div className="p-10 flex items-center justify-center h-screen">
        <Card className="flex flex-col w-full max-w-sm items-center gap-1.5 p-6 justify-center">
          <Image
            className="relative dark:hidden mb-6"
            src="/logo-light.svg"
            alt="Next.js Logo"
            width={180}
            height={37}
            priority
          />
          <Image
            className="relative hidden dark:block mb-6"
            src="/logo-dark.svg"
            alt="Next.js Logo"
            width={180}
            height={37}
            priority
          />
          <AuthForm authType="signin" />
          <Link href="/auth/signin" className="mt-6 text-sm">
            Ainda não possui conta?
          </Link>
        </Card>
      </div>
    </div>
  );
}

export default Signin;
