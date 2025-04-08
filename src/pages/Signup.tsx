import { SignUp } from '@clerk/clerk-react'

const SignUpPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <SignUp 
        signInUrl='/login'
        forceRedirectUrl='/dashboard'
        routing='hash'
      />
    </div>
  )
}

export default SignUpPage