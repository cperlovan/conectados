const BankAccount = require('../models/BankAccount');

// Crear una nueva cuenta bancaria
exports.createBankAccount = async (req, res) => {
  const { accountNumber, bankName, balance, condominiumId } = req.body;

  try {
    const account = await BankAccount.create({ accountNumber, bankName, balance, condominiumId });
    res.status(201).json({ message: 'Cuenta bancaria creada exitosamente.', account });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la cuenta bancaria.', error });
  }
};

// Obtener todas las cuentas bancarias de un condominio
exports.getBankAccountsByCondominium = async (req, res) => {
  const { condominiumId } = req.params;

  try {
    const accounts = await BankAccount.findAll({ where: { condominiumId } });
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las cuentas bancarias.', error });
  }
};

// Actualizar una cuenta bancaria
exports.updateBankAccount = async (req, res) => {
  const { id } = req.params;
  const { accountNumber, bankName, balance, status } = req.body;

  try {
    const account = await BankAccount.findByPk(id);
    if (!account) {
      return res.status(404).json({ message: 'Cuenta bancaria no encontrada.' });
    }

    await account.update({ accountNumber, bankName, balance, status });
    res.status(200).json({ message: 'Cuenta bancaria actualizada exitosamente.', account });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la cuenta bancaria.', error });
  }
};

// Eliminar lógicamente una cuenta bancaria
exports.deleteBankAccount = async (req, res) => {
  const { id } = req.params;

  try {
    const account = await BankAccount.findByPk(id);
    if (!account) {
      return res.status(404).json({ message: 'Cuenta bancaria no encontrada.' });
    }

    await account.update({ status: 'inactive' });
    res.status(200).json({ message: 'Cuenta bancaria eliminada.', account });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la cuenta bancaria.', error });
  }
};