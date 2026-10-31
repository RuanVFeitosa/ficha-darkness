// Text is the source of truth. Each browser renders it locally, without R2 uploads.
export function sharedCustomToken(token){
 return token.uvText ? {...token,image:''} : token;
}
