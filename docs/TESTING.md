# 🧪 Guide Complet de Test NDB MCP Server

Ce guide présente toutes les méthodes disponibles pour tester le serveur MCP NDB sans dépendre de Claude Desktop. Ces tests sont essentiels pour le développement, le debugging et la validation des fonctionnalités.

## 📋 Table des Matières

- [Scripts de Test Disponibles](#scripts-de-test-disponibles)
- [Méthodes de Test](#méthodes-de-test)
- [Tests par Niveau](#tests-par-niveau)
- [Debugging et Troubleshooting](#debugging-et-troubleshooting)
- [Bonnes Pratiques](#bonnes-pratiques)

## 🔧 Scripts de Test Disponibles

| Script | Commande | Description |
|--------|----------|-------------|
| **Connection Test** | `npm run test:connection` | Test de connectivité NDB basique |
| **Connection Debug** | `npm run test:connection:debug` | Test de connexion avec logs détaillés |
| **MCP Test** | `npm run test:mcp` | Test fonctionnalités MCP complètes |
| **MCP Inspector** | `npm run test:inspector` | Interface web interactive pour tests |
| **All Tests** | `npm run test:all` | Tests complets (connexion + MCP) |

## 🔍 Méthodes de Test

### 1. 🔧 MCP Inspector (Méthode Recommandée)

L'inspector fournit une interface web intuitive pour tester les outils MCP :

```bash
# Lancer l'interface web interactive
npm run test:inspector

# Ou directement avec npx
npx @modelcontextprotocol/inspector node dist/index.js
```

**Avantages :**
- ✅ Interface web intuitive
- ✅ Test interactif des outils
- ✅ Visualisation des réponses JSON
- ✅ Debug en temps réel
- ✅ Test des paramètres d'outils

### 2. 📝 Scripts de Test Intégrés

#### Test de Connexion NDB
```bash
# Test basique de connectivité
npm run test:connection

# Test avec logs de debug détaillés
npm run test:connection:debug
```

#### Test MCP Complet
```bash
# Test des fonctionnalités MCP
npm run test:mcp

# Test complet (connexion + MCP)
npm run test:all
```

### 3. 🐍 Client Python de Test

Le script Python offre un test approfondi des fonctionnalités MCP :

```bash
# Via le script npm
npm run test:mcp

# Ou directement
python3 scripts/test-mcp-client.py
```

**Fonctionnalités du client Python :**
- ✅ Test des outils MCP
- ✅ Validation des réponses JSON-RPC
- ✅ Test de gestion d'erreurs
- ✅ Menu interactif
- ✅ Test de performance

### 4. 💻 Test Manuel en Ligne de Commande

#### Démarrage du Serveur
```bash
# Avec configuration .env
npm start

# Le serveur écoute sur stdin/stdout
```

#### Tests JSON-RPC Manuels
```bash
# Test 1: Lister les outils disponibles
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js

# Test 2: Appeler un outil spécifique
echo '{
  "jsonrpc": "2.0", 
  "id": 2, 
  "method": "tools/call", 
  "params": {
    "name": "ndb_list_databases", 
    "arguments": {}
  }
}' | node dist/index.js

# Test 3: Outil avec paramètres
echo '{
  "jsonrpc": "2.0", 
  "id": 3, 
  "method": "tools/call", 
  "params": {
    "name": "ndb_get_database", 
    "arguments": {"database_id": "your-db-id"}
  }
}' | node dist/index.js
```

## 🎯 Tests par Niveau

### Niveau 1 : Test Basique
```bash
# 1. Build du projet
npm run build

# 2. Test de connexion NDB
npm run test:connection

# 3. Si connexion OK, test MCP
npm run test:mcp
```

### Niveau 2 : Test Interactif
```bash
# Interface graphique pour tests manuels
npm run test:inspector
```

### Niveau 3 : Test de Développement
```bash
# Terminal 1: Mode développement
npm run dev

# Terminal 2: Tests en parallèle
npm run test:mcp
```

### Niveau 4 : Test Avancé avec Debug
```bash
# Test avec logs détaillés
DEBUG=ndb:* npm run test:connection:debug
NODE_ENV=development npm run test:mcp
```

## 🔍 Types de Tests Couverts

### Tests Fonctionnels
- ✅ Listing des outils disponibles (30+ outils)
- ✅ Appel d'outils avec paramètres
- ✅ Validation des réponses JSON-RPC
- ✅ Gestion des erreurs et exceptions
- ✅ Test des workflows complets

### Tests de Performance
- ✅ Temps de réponse des API NDB
- ✅ Gestion des timeouts
- ✅ Test de charge avec multiples requêtes
- ✅ Mesure de latence

### Tests d'Intégration
- ✅ Connexion NDB (token et basic auth)
- ✅ Authentification et renouvellement
- ✅ Accès aux différents endpoints NDB
- ✅ Validation SSL et certificats

## 📊 Exemple de Sortie de Test

### Test MCP Complet
```
🧪 Testing NDB MCP Server

📋 Test 1: List available tools
✅ Found 30 tools:
   - ndb_list_databases: List all databases in NDB environment
   - ndb_get_database: Get detailed information about a specific database
   - ndb_list_clones: List all database clones
   - ndb_create_clone: Create a new database clone
   - ndb_list_snapshots: List all snapshots
   ... and 25 more tools

🔧 Test 2: Call ndb_list_databases tool
✅ Database list retrieved successfully
   Response type: text
   Found 5 databases in NDB environment:
   • production-app-db (PostgreSQL) - Status: READY
   • staging-web-db (MySQL) - Status: READY

🔧 Test 3: Call ndb_list_clusters tool
✅ Cluster list retrieved successfully

🔧 Test 4: Test error handling with invalid tool
✅ Error handling works correctly
   Error: Tool not found: invalid_tool_name

⏱️ Performance Summary:
   - Average response time: 245ms
   - Fastest call: 89ms (ndb_list_clusters)
   - Slowest call: 423ms (ndb_list_databases)
```

### Test de Connexion
```
🔗 Testing NDB Connection

📡 Testing Basic Connectivity...
✅ NDB server is reachable at https://your-ndb.company.com

🔐 Testing Authentication...
✅ Authentication successful (Token-based)

🏥 Testing Health Check...
✅ NDB service is healthy

🎯 Testing API Endpoints...
✅ /clusters endpoint: OK
✅ /databases endpoint: OK
✅ /profiles endpoint: OK

🚀 Connection test completed successfully!
```

## 🛠️ Debugging et Troubleshooting

### Debug avec Logs Détaillés
```bash
# Variables de debug complètes
DEBUG=ndb:* npm run test:mcp
NODE_ENV=development npm run test:mcp

# Debug spécifique aux API calls
DEBUG=ndb:api npm run test:connection
```

### Test avec Configuration Spécifique
```bash
# Test avec environnement custom
NDB_BASE_URL=https://test-ndb.company.com \
NDB_USERNAME=test-user \
NDB_PASSWORD=test-pass \
npm run test:mcp

# Test sans vérification SSL (développement)
NDB_VERIFY_SSL=false npm run test:connection

# Test avec timeout custom
NDB_TIMEOUT=10000 npm run test:mcp
```

### Diagnostique des Problèmes Courants

#### Erreur de Connexion
```bash
# Vérifier la connectivité réseau
ping your-ndb-server.com

# Test avec curl
curl -k https://your-ndb-server.com/era/v0.9/clusters

# Test debug avec logs complets
npm run test:connection:debug
```

#### Erreur d'Authentification
```bash
# Vérifier les variables d'environnement
echo $NDB_USERNAME
echo $NDB_BASE_URL

# Test avec credentials différents
NDB_USERNAME=admin NDB_PASSWORD=newpass npm run test:connection
```

#### Problèmes de Performance
```bash
# Test avec timeout étendu
NDB_TIMEOUT=30000 npm run test:mcp

# Monitoring des calls API
DEBUG=ndb:performance npm run test:all
```

## 🎯 Tests Avancés

### Test de Stress
```bash
# Multiple appels simultanés
for i in {1..10}; do
  npm run test:mcp &
done
wait
```

### Test avec Différents Environnements
```bash
# Production
NODE_ENV=production npm run test:all

# Staging
NODE_ENV=staging npm run test:all

# Development avec verbose
NODE_ENV=development DEBUG=* npm run test:all
```

### Test de Scenarios Spécifiques
```bash
# Test workflow complet : List → Get → Clone
python3 scripts/test-mcp-client.py --workflow database_management

# Test gestion d'erreurs
python3 scripts/test-mcp-client.py --test error_handling

# Test performance
python3 scripts/test-mcp-client.py --benchmark
```

## 🎯 Bonnes Pratiques de Test

### 1. **Ordre de Test Recommandé**
1. `npm run test:connection` - Vérifier la connectivité
2. `npm run test:inspector` - Tests interactifs
3. `npm run test:mcp` - Tests automatisés complets
4. `npm run test:all` - Validation finale

### 2. **Variables d'Environnement de Test**
```bash
# Fichier .env.test recommandé
NDB_BASE_URL=https://test-ndb.company.com
NDB_USERNAME=test-user
NDB_PASSWORD=test-password
NDB_VERIFY_SSL=false
NDB_TIMEOUT=15000
DEBUG=ndb:*
```

### 3. **Test en CI/CD**
```bash
# Script pour intégration continue
npm run build
npm run test:connection
npm run test:mcp
```

### 4. **Test de Régression**
- Testez avec différentes versions de Node.js
- Vérifiez la compatibilité des dépendances
- Testez les cas d'erreur edge cases

### 5. **Monitoring et Métriques**
- Surveillez les temps de réponse
- Vérifiez les taux d'erreur
- Monitorer l'utilisation mémoire

## 🚀 Prochaines Étapes

Après avoir validé votre serveur MCP avec ces tests, vous pouvez :

1. **Intégrer avec Claude Desktop** : Suivre le guide d'installation
2. **Déployer en Production** : Utiliser les configurations testées
3. **Contribuer** : Ajouter de nouveaux tests pour vos fonctionnalités
4. **Optimiser** : Utiliser les métriques de performance pour l'optimisation

---

**Note :** Ces tests vous permettent de valider complètement votre serveur MCP sans dépendre de Claude Desktop, ce qui est essentiel pour un développement robuste et un debugging efficace ! 🚀