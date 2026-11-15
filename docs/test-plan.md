# Plano de testes

Plano central com criticidade P0/P1/P2, matriz de cobertura, limites e triagem:
[veli-backend/docs/test-plan.md](https://github.com/MatheusGeambastiane/veli-backend/blob/main/docs/test-plan.md).

A rotina `.github/workflows/daily-tests.yml` roda diariamente às 06h15
America/Bahia (09h15 UTC), também em pull requests e por execução manual.
Logs e relatórios ficam nos artefatos do GitHub Actions por 14 dias.

Os testes locais usam dados sintéticos e build de produção em ambiente isolado.
Não carregar `.env` ou credenciais reais. Os comandos e as portas utilizadas
estão no plano central.
