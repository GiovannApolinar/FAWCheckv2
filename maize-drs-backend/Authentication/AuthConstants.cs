namespace maize_drs_backend.Authentication
{
    public static class AuthConstants
    {
        public const string JwtScheme = "Bearer";
        public const string LocalUserIdClaimType = "local_user_id";
        public const string AdminRole = "Admin";
        public const string UserRole = "User";
        public const string SimpleRoleClaimType = "role";
    }
}
