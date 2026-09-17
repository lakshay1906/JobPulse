### 1. Refresh does not verify the JWT

You use jwt.decode() only — that does not check signature, expiry, or secret. Anyone can forge a payload with a tokenId / sub and rotate tokens. Use jwt.verifyAsync(..., { secret: REFRESH_TOKEN_SECRET }).

### 2. You never check the DB token before rotating

After verifying the JWT you should load the row by tokenId and ensure:

<ul>
<li>it exists</li>
<li>revokedAt is null</li>
<li>expiresAt is in the future</li>
<li>bcrypt.compare(refreshToken, tokenHash) succeeds</li>
</ul>
Without that, stolen/revoked/expired tokens can still be used if the JWT hasn’t expired (and with decode-only, even forged ones).
