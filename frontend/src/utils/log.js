export const registrarLog = async (userId, username, acao) => {
    const apiUrl = process.env.REACT_APP_API_URL;
  
    try {
      await fetch(`${apiUrl}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, username, acao }),
      });
    } catch (err) {
      console.error('Erro ao registrar log:', err);
    }
  };
  