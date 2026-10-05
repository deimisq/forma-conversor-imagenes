!include "LogicLib.nsh"
!include "nsDialogs.nsh"

!ifndef BUILD_UNINSTALLER
  Var FormaInstalledVersion
  Var FormaMaintenanceAction
  Var FormaMaintenanceDialog
  Var FormaUpdateRadio
  Var FormaModifyRadio
  Var FormaRepairRadio
  Var FormaDesktopShortcut
  Var FormaStartMenuShortcut
  Var FormaDesktopChoice
  Var FormaStartMenuChoice

  !macro preInit
    ReadRegStr $FormaInstalledVersion HKCU "${UNINSTALL_REGISTRY_KEY}" "DisplayVersion"
    ${If} $FormaInstalledVersion == ""
      ReadRegStr $FormaInstalledVersion HKLM "${UNINSTALL_REGISTRY_KEY}" "DisplayVersion"
    ${EndIf}
  !macroend

  !macro customWelcomePage
    !insertmacro MUI_PAGE_WELCOME
    PageEx custom
      PageCallbacks FormaMaintenancePage FormaMaintenancePageLeave
    PageExEnd
  !macroend

  Function FormaMaintenancePage
    ${If} $FormaInstalledVersion == ""
      Abort
    ${EndIf}

    nsDialogs::Create 1018
    Pop $FormaMaintenanceDialog
    ${If} $FormaMaintenanceDialog == error
      Abort
    ${EndIf}

    ${NSD_CreateLabel} 0u 0u 100% 24u "Se detectó Forma $FormaInstalledVersion. Selecciona qué quieres hacer con esta instalación."
    Pop $0
    ${NSD_CreateRadioButton} 0u 32u 100% 18u "Actualizar a Forma ${VERSION}"
    Pop $FormaUpdateRadio
    ${NSD_CreateRadioButton} 0u 57u 100% 18u "Modificar accesos directos"
    Pop $FormaModifyRadio
    ${NSD_CreateRadioButton} 0u 82u 100% 18u "Reparar archivos de la aplicación"
    Pop $FormaRepairRadio
    SendMessage $FormaUpdateRadio ${BM_SETCHECK} ${BST_CHECKED} 0

    ${NSD_CreateLabel} 0u 112u 100% 28u "Opciones para Modificar. Actualizar y Reparar conservan la configuración actual de accesos directos."
    Pop $0
    ${NSD_CreateCheckbox} 12u 145u 100% 18u "Acceso directo en el escritorio"
    Pop $FormaDesktopShortcut
    SendMessage $FormaDesktopShortcut ${BM_SETCHECK} ${BST_CHECKED} 0
    ${NSD_CreateCheckbox} 12u 170u 100% 18u "Acceso directo en el menú Inicio"
    Pop $FormaStartMenuShortcut
    SendMessage $FormaStartMenuShortcut ${BM_SETCHECK} ${BST_CHECKED} 0
    nsDialogs::Show
  FunctionEnd

  Function FormaMaintenancePageLeave
    SendMessage $FormaUpdateRadio ${BM_GETCHECK} 0 0 $0
    ${If} $0 == ${BST_CHECKED}
      StrCpy $FormaMaintenanceAction "update"
    ${Else}
      SendMessage $FormaModifyRadio ${BM_GETCHECK} 0 0 $0
      ${If} $0 == ${BST_CHECKED}
        StrCpy $FormaMaintenanceAction "modify"
      ${Else}
        StrCpy $FormaMaintenanceAction "repair"
      ${EndIf}
    ${EndIf}
    ${NSD_GetState} $FormaDesktopShortcut $FormaDesktopChoice
    ${NSD_GetState} $FormaStartMenuShortcut $FormaStartMenuChoice
  FunctionEnd

  !macro customInstall
    ${If} $FormaMaintenanceAction == "modify"
      ${If} $FormaDesktopChoice == ${BST_CHECKED}
        CreateShortCut "$newDesktopLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
        WinShell::SetLnkAUMI "$newDesktopLink" "${APP_ID}"
      ${Else}
        Delete "$newDesktopLink"
      ${EndIf}

      ${If} $FormaStartMenuChoice == ${BST_CHECKED}
        !ifdef MENU_FILENAME
          CreateDirectory "$SMPROGRAMS\${MENU_FILENAME}"
        !endif
        CreateShortCut "$newStartMenuLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
        WinShell::SetLnkAUMI "$newStartMenuLink" "${APP_ID}"
      ${Else}
        Delete "$newStartMenuLink"
      ${EndIf}
      System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
    ${EndIf}
  !macroend
!endif