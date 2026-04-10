import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage() {
  return (
    <div className="min-h-screen flex bg-[#FAF8F3]">
      {/* Left Panel - Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 p-10 pb-10 pt-10 pl-10">
        <div className="w-full relative rounded-[2rem] overflow-hidden shadow-2xl group">
          {/* Background Image with Hover Scale */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{
              backgroundImage: "url('/images/background.jpg')",
            }}
          ></div>

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F3]/90 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#6B2C2C]/40 to-transparent mix-blend-multiply"></div>

          {/* Logo at Top */}
          <div className="absolute top-10 left-10 z-10">
            <img
              src="/images/logo_h.png"
              alt="HOPECARD Logo"
              className="h-16 w-16 object-contain drop-shadow-lg"
            />
          </div>

          {/* Bottom Text Content */}
          <div className="absolute bottom-16 left-12 right-12 z-10 text-white">
            <h1 className="text-6xl font-black mb-6 font-[family-name:var(--font-plus-jakarta-sans)] tracking-tight leading-tight" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}>
              Empower <span className="italic text-[#FF8A80]">stories</span>
              <br />
              that <span className="italic text-[#FF8A80]">matter</span>
            </h1>
            <p className="text-base text-white max-w-md font-[family-name:var(--font-manrope)] font-medium" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
              Access your personalized dashboard to view your financial assistance and manage your recovery support safely.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.05)] p-8">
        <div className="w-full max-w-[380px]">
          {/* Header */}
          <h2 className="text-5xl lg:text-6xl font-black mb-4 text-black font-[family-name:var(--font-plus-jakarta-sans)] tracking-tight leading-[0.95]">
            Welcome
            <br />
            <span className="italic text-[#6B2C2C]">back!</span>
          </h2>
          <p className="text-[14px] font-medium text-gray-500 mb-6 max-w-sm font-[family-name:var(--font-manrope)]">
            Please enter your beneficiary details to access your support dashboard. Every contribution is a heartbeat for change.
          </p>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
