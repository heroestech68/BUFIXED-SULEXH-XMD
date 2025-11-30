const alphautil = async (context, next) => {
    const { ms, superUser, verifAdmin, verifGroupe } = context;

    if (!verifGroupe) {
        return repondre("❌ This command is meant for groups");
    }

    if (!superUser) {
        return repondre("❌ You need owner permission to execute this command.");
    }

    // Owner (superUser) bypasses admin restriction
    if (!verifAdmin && !superUser) {
        return repondre("❌ I need admin privileges");
    }

    await next();
};

module.exports = alphautil;
