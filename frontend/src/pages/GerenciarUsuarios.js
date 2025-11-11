import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './GerenciarUsuarios.css';

const GerenciarUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    role: '',
    permittedModules: '',
    password: '',
  });

  useEffect(() => {
    buscarUsuarios();
  }, []);

  useEffect(() => {
    if (modoEdicao && !usuarioSelecionado) {
      setForm({
        username: '',
        email: '',
        role: '',
        permittedModules: '',
        password: '',
      });
    }
  }, [modoEdicao, usuarioSelecionado]);


  const buscarUsuarios = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/usuarios`);
      setUsuarios(res.data);
    } catch (err) {
      console.error('Erro ao buscar usuários', err);
    }
  };

  const handleEditar = (usuario) => {
    setModoEdicao(true);
    setUsuarioSelecionado(usuario);
    setForm({
      username: usuario.username || '',
      email: usuario.email || '',
      role: usuario.role || '',
      permittedModules: (usuario.permittedModules || []).join(', '),
      password: '',
    });
  };

  const handleNovo = () => {
    setUsuarioSelecionado(null);
    setForm({
      username: '',
      email: '',
      role: '',
      permittedModules: '',
      password: '',
    });
    setModoEdicao(false);
    setTimeout(() => {
      setModoEdicao(true);
    }, 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const salvar = async () => {
    const payload = {
      username: form.username,
      email: form.email,
      role: form.role,
      permittedModules: form.permittedModules.split(',').map(m => m.trim()),
    };

    if (form.password) {
      payload.password = form.password;
    }

    try {
      if (usuarioSelecionado) {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/usuarios/${usuarioSelecionado._id}`, payload);
        Swal.fire({ title: 'Atualizado!', text: 'Usuário atualizado.', icon: 'success', confirmButtonText: 'OK' });
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/usuarios`, payload);
        Swal.fire({ title: 'Criado!', text: 'Novo usuário cadastrado.', icon: 'success', confirmButtonText: 'OK' });
      }

      setModoEdicao(false);
      buscarUsuarios();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      Swal.fire({ title: 'Erro', text: 'Falha ao salvar usuário.', icon: 'error', confirmButtonText: 'OK' });
    }
  };

  const alterarSenha = async (usuario) => {
    const { value: novaSenha } = await Swal.fire({
      title: `Alterar senha de ${usuario.username}`,
      input: 'password',
      inputLabel: 'Nova senha',
      inputPlaceholder: 'Digite a nova senha',
      showCancelButton: true
    });

    if (novaSenha) {
      try {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/usuarios/${usuario._id}/senha`, { password: novaSenha });
        Swal.fire('Senha atualizada com sucesso!', '', 'success');
      } catch (err) {
        Swal.fire('Erro ao atualizar senha', '', 'error');
      }
    }
  };

  return (
    <div>
      <h2 className='titulo'>Gerenciar Usuários</h2>
      <button className='botao-novo' onClick={handleNovo}>Novo Usuário</button>
      <table className='gerenciar-usuarios-container'>
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Email</th>
            <th>Perfil</th>
            <th>Módulos Permitidos</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u._id}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{(u.permittedModules || []).join(', ')}</td>
              <td>
                <button className='botao' onClick={() => handleEditar(u)}>Editar</button>{' '}
                <button className='botao' onClick={() => alterarSenha(u)}>Alterar Senha</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modoEdicao && (
        <div className="modal-edicao">
          <h3>{usuarioSelecionado ? `Usuário: ${usuarioSelecionado.username}` : 'Novo Usuário'}</h3>
          <input name="username" autoComplete="off" value={form.username} onChange={handleChange} placeholder="Usuário" />
          <input name="email" autoComplete="off" value={form.email} onChange={handleChange} placeholder="Email" />
          <input name="role" autoComplete="off" value={form.role} onChange={handleChange} placeholder="Perfil (ex: admin)" />
          <input name="permittedModules" autoComplete="off" value={form.permittedModules} onChange={handleChange} placeholder="Módulos (separados por vírgula)" />
          <input name="password" type="password" autoComplete="new-password" value={form.password} onChange={handleChange} placeholder={usuarioSelecionado ? 'Nova senha (opcional)' : 'Senha'} />
          <br />
          <button className='botao' onClick={salvar}>Salvar</button>
          <button className='botao' onClick={() => setModoEdicao(false)}>Cancelar</button>
        </div>
      )}
    </div>
  );
};

export default GerenciarUsuarios;

