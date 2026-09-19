const express = require('express');
const router = express.Router();
const services = require('../../data/services.json');
const packages = require('../../data/packages.json');
const photographers = require('../../data/photographers.json');
const bookingRules = require('../../data/booking_rules.json');

router.get('/services', (req, res) => {
  res.json({ success: true, services });
});

router.get('/packages', (req, res) => {
  const { serviceId } = req.query;
  const result = serviceId ? packages.filter(p => p.service_id === serviceId) : packages;
  res.json({ success: true, packages: result });
});

router.get('/photographers', (req, res) => {
  res.json({ success: true, photographers });
});

router.get('/rules', (req, res) => {
  res.json({ success: true, rules: bookingRules });
});

module.exports = router;
