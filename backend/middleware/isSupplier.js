const isSupplier = (req, res, next) => {
  if (req.user && req.user.role === 'proveedor') {
    next();
  } else {
    res.status(403).json({
      message: "Acceso denegado. Se requieren privilegios de proveedor."
    });
  }
}; 