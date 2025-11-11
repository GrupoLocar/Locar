import React, { useState } from 'react';

const CepInput = ({ value, onChange }) => {
  const handleChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);

    if (val.length > 5) {
      val = `${val.slice(0, 2)}.${val.slice(2, 5)}-${val.slice(5)}`;
    } else if (val.length > 2) {
      val = `${val.slice(0, 2)}.${val.slice(2)}`;
    }

    onChange(val);
  };

  return (
    <input
      type="text"
      className="cep"
      maxLength="10"
      required
      placeholder="cep"
      value={value}
      onChange={handleChange}
    />
  );
};

export default CepInput;
