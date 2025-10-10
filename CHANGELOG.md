# Changelog

## [Unreleased] - 2025-10-09

### 🔧 Fixed
- **CORS Error**: PATCH method artık CORS'da destekleniyor
- **Permission Field**: Tüm API response'ları artık `permission` alanı içeriyor
- **Auto-save**: Incremental ve full save artık düzgün çalışıyor
- **Board Name Update**: İsim değişikliğinden sonra permission artık korunuyor

### ✨ Added
- **Backend Validation**: PATCH endpoint'e strict validation eklendi
- **Permission Helper**: Service layer'a `addPermissionField()` helper eklendi
- **Better Error Messages**: API error messages daha açıklayıcı
- **Consistent Responses**: Tüm endpoint'ler aynı formatta response dönüyor

### 🚀 Improved
- **patchBoard() Controller**: Optimize edildi ve 3 farklı update tipini güvenli şekilde yönetiyor
- **Frontend State Sync**: Board state ve permission artık tam senkronize
- **Error Logging**: Backend'de daha detaylı error logging

### 📄 Technical Changes

#### Backend (`/home/emir/story-back/`)
- `src/index.js`: CORS methods'a PATCH eklendi
- `src/services/boardService.js`: 
  - `addPermissionField()` helper eklendi
  - Tüm fonksiyonlar permission field döndürüyor
  - `applyPatches()` full board data döndürüyor
- `src/controllers/boardController.js`:
  - `patchBoard()` exclusive validation eklendi
  - Empty data validation eklendi
  - Tutarlı error handling

#### Frontend (`/home/emir/story-planner/`)
- `src/components/ReactFlowPlanner.jsx`:
  - `handleBoardNameChange()` full board sync yapıyor
  - Permission state güncelleniyor

---

## Önceki Sürümler

### [1.0.0] - İlk Release
- Story planner temel özellikleri
- Board yönetimi
- Node/Edge sistemi
- Auto-save mekanizması
- Authentication

