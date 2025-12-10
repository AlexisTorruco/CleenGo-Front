import Image from "next/image";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7FAFC] text-[#0C2340] px-4">
      {/* Logo */}
      {/* <Image
        src="/CleenGo-Front/public/logo-sin-fondo.png"
        alt="CleenGo Logo"
        width={200}
        height={80}
        className="h-20 mb-6 w-auto"
      /> */}

      {/* Formulario tradicional */}
      <LoginForm />
    </div>
  );
}
