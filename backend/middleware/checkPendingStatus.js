const checkPendingStatus = (req, res, next) => {
    const user = req.user;
  
    if (user.status === 'pending') {
      return res.status(403).json({
        message: "Acceso denegado. Debes completar los datos de proveedor para continuar.",
      });
    }
  
    next();
  };
  
  module.exports = checkPendingStatus;