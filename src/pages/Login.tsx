import { SignIn } from '@clerk/clerk-react'

const SignInPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <SignIn 
        signUpUrl='/signup'
        forceRedirectUrl='/dashboard'
        routing='hash'
      />
    </div>
  )
}

export default SignInPage