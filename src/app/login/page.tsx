import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    redirect?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};

  return <LoginForm redirectTo={params.redirect} />;
}
