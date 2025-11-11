import { useState } from "react";

export default function CPFInput() {
  const [cpf, setCpf] = useState("");

  const formatarCPF = (valor) => {
    const apenasNumeros = valor.replace(/\D/g, "").slice(0, 11);
    return apenasNumeros
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const handleChange = (e) => {
    setCpf(formatarCPF(e.target.value));
  };

  return (
    <input
      className="cpf"
      type="text"
      required
      placeholder="cpf"
      inputMode="numeric"
      maxLength={14}
      value={cpf}
      onChange={handleChange}
    />
  );
}
