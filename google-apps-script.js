/**
 * Google Apps Script para receber logs de acesso do HUB SECTI
 * 
 * INSTALAÇÃO:
 * 1. Abra sua planilha: https://docs.google.com/spreadsheets/d/1OzSpSHIXIURRTl7NLlBfAYJJM1y4vv7KVgVRjqRdXVE/edit
 * 2. Extensões → Apps Script
 * 3. Apague todo o código existente
 * 4. Cole este código
 * 5. Salve (Ctrl+S)
 * 6. Implante como App da Web (ver instruções abaixo)
 * 
 * IMPLANTAÇÃO:
 * 1. Clique em "Implantar" → "Nova implantação"
 * 2. Tipo: "App da Web"
 * 3. Descrição: "HUB Access Logger"
 * 4. Executar como: "Eu"
 * 5. Quem pode acessar: "Qualquer pessoa"
 * 6. Clique em "Implantar"
 * 7. Copie a URL gerada
 * 8. Atualize o arquivo netlify/functions/log-access.ts com esta URL
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    
    // Verifica se é a primeira execução, cria cabeçalhos se necessário
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Data", "Hora", "IP", "Endpoint", "User Agent"]);
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold");
      sheet.getRange(1, 1, 1, 5).setBackground("#4285f4");
      sheet.getRange(1, 1, 1, 5).setFontColor("white");
      sheet.setFrozenRows(1);
      
      // Ajusta largura das colunas
      sheet.setColumnWidth(1, 100); // Data
      sheet.setColumnWidth(2, 100); // Hora
      sheet.setColumnWidth(3, 150); // IP
      sheet.setColumnWidth(4, 250); // Endpoint
      sheet.setColumnWidth(5, 400); // User Agent
    }
    
    // Parse dos dados recebidos
    var data = JSON.parse(e.postData.contents);
    
    // Validação básica
    if (!data.timestamp || !data.ip) {
      return createResponse(false, "Dados inválidos: timestamp e IP são obrigatórios");
    }
    
    // Formata data e hora para timezone de Brasília
    var date = new Date(data.timestamp);
    var formattedDate = Utilities.formatDate(date, "America/Sao_Paulo", "dd/MM/yyyy");
    var formattedTime = Utilities.formatDate(date, "America/Sao_Paulo", "HH:mm:ss");
    
    // Adiciona nova linha na planilha
    sheet.appendRow([
      formattedDate,
      formattedTime,
      data.ip || "N/A",
      data.path || "N/A",
      data.userAgent || "N/A"
    ]);
    
    // Formata a última linha (opcional: zebrado)
    var lastRow = sheet.getLastRow();
    if (lastRow % 2 === 0) {
      sheet.getRange(lastRow, 1, 1, 5).setBackground("#f8f9fa");
    }
    
    return createResponse(true, "Log registrado com sucesso", {
      row: lastRow,
      timestamp: data.timestamp
    });
    
  } catch (error) {
    Logger.log("Erro ao processar log: " + error.toString());
    return createResponse(false, "Erro interno: " + error.toString());
  }
}

/**
 * Função auxiliar para criar resposta JSON
 */
function createResponse(success, message, data) {
  var response = {
    success: success,
    message: message
  };
  
  if (data) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Função de teste (opcional)
 * Executa manualmente para verificar se está funcionando
 */
function testLog() {
  var testData = {
    timestamp: new Date().toISOString(),
    ip: "127.0.0.1",
    path: "/test",
    userAgent: "Test Browser"
  };
  
  Logger.log("Dados de teste: " + JSON.stringify(testData));
  
  // Simula um POST
  var sheet = SpreadsheetApp.getActiveSheet();
  var date = new Date(testData.timestamp);
  var formattedDate = Utilities.formatDate(date, "America/Sao_Paulo", "dd/MM/yyyy");
  var formattedTime = Utilities.formatDate(date, "America/Sao_Paulo", "HH:mm:ss");
  
  sheet.appendRow([
    formattedDate,
    formattedTime,
    testData.ip,
    testData.path,
    testData.userAgent
  ]);
  
  Logger.log("Teste concluído! Verifique a planilha.");
}

/**
 * Função para limpar logs antigos (opcional)
 * Mantém apenas os últimos 90 dias
 */
function cleanupOldLogs(daysToKeep = 90) {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    Logger.log("Nenhum dado para limpar");
    return;
  }
  
  var cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  var rowsToDelete = [];
  
  // Começa da linha 2 (pula cabeçalho)
  for (var i = 2; i <= lastRow; i++) {
    var dateStr = sheet.getRange(i, 1).getValue();
    var timeStr = sheet.getRange(i, 2).getValue();
    
    if (dateStr && timeStr) {
      var rowDate = new Date(dateStr + " " + timeStr);
      if (rowDate < cutoffDate) {
        rowsToDelete.push(i);
      }
    }
  }
  
  // Deleta de trás para frente para não deslocar as linhas
  for (var j = rowsToDelete.length - 1; j >= 0; j--) {
    sheet.deleteRow(rowsToDelete[j]);
  }
  
  Logger.log("Limpeza concluída. " + rowsToDelete.length + " registros removidos.");
}

/**
 * Trigger automático para limpeza mensal (configurar no Apps Script)
 * 1. Clique no ícone de "Trigger" (relógio) na barra lateral
 * 2. Adicionar trigger
 * 3. Função: cleanupOldLogs
 * 4. Origem: Com base no tempo
 * 5. Tipo: Mensal
 */