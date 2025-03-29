const isSuperAdmin = (req, res, next) => {
  //console.log('Usuario en req:', req.user); // Para debug
  
  if (!req.user) {
    return res.status(401).json({
      message: "No autenticado"
    });
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      message: "Acceso denegado. Se requieren privilegios de superadmin."
    });
  }

  next();
};

module.exports = isSuperAdmin; 