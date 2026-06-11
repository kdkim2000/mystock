interface Props { error: string }

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: 'OAuth 로그인 오류가 발생했습니다.',
  OAuthCallback: 'OAuth 콜백 처리 중 오류가 발생했습니다.',
  OAuthCreateAccount: '계정 생성 중 오류가 발생했습니다.',
  EmailCreateAccount: '이메일 계정 생성 중 오류가 발생했습니다.',
  Callback: '콜백 처리 중 오류가 발생했습니다.',
  AccessDenied: '접근 권한이 없습니다. 허용된 계정으로 로그인해주세요.',
  Verification: '인증 토큰이 만료되었거나 이미 사용되었습니다.',
  Default: '로그인 중 오류가 발생했습니다. 다시 시도해주세요.',
}

export function AuthErrorMessage({ error }: Props) {
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default

  return (
    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  )
}
