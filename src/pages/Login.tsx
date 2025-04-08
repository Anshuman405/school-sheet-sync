import { SignIn } from '@clerk/clerk-react'

const SignInPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <SignIn 
        signUpUrl='/signup'
        path='/login'
        routing='path'
      />
    </div>
  )
}

export default SignInPage