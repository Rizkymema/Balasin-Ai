import { LoginForm } from "@/components/auth/login-form";

// Redirect tujuan login berasal dari query string, sehingga halaman ini harus dirender dinamis.
export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<{
    redirect?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};

  return <LoginForm redirectTo={params.redirect} />;
}
