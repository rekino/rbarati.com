exports.formatUser = (user) => {
    return {
        username: user.username,
        role: user.role || "user"
    };
};
