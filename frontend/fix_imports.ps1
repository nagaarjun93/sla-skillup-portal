$screensPath = "c:\Users\NAGA ARJUN\Documents\NMA1\frontend\src\screens"
Get-ChildItem -Path $screensPath -Filter "*.jsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "import \{ useRouter \} from 'expo-router';", "import { useUniversalRouter } from '../utils/useUniversalRouter';"
    $content = $content -replace "import \{ useRouter, useLocalSearchParams \} from 'expo-router';", "import { useUniversalRouter } from '../utils/useUniversalRouter'; `nimport { useRoute } from '@react-navigation/native';"
    $content = $content -replace "const router = useRouter\(\);", "const router = useUniversalRouter();"
    Set-Content -Path $_.FullName -Value $content
    Write-Host "Updated: $($_.Name)"
}
Write-Host "Done!"
