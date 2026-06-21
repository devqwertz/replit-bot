export function buildKeySystemLua(opts: {
  scriptKey: string;
  apiBase: string;
  displayName: string;
  keyUrl: string;
}): string {
  const { scriptKey, apiBase, displayName, keyUrl } = opts;
  const dn = displayName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const sk = scriptKey.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const ab = apiBase.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const ku = keyUrl.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  return `-- Xeioa Key System v2
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

local SCRIPT_KEY = "${sk}"
local API_BASE = "${ab}"
local DISPLAY_NAME = "${dn}"
local KEY_URL = "${ku}"
local KEY_FILE = "xeioa_" .. SCRIPT_KEY .. ".key"

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Try to auto-verify a saved key; if valid, run script immediately
local function tryAutoVerify()
    local ok, saved = pcall(readfile, KEY_FILE)
    if not ok or type(saved) ~= "string" or #saved < 8 then return false end
    saved = saved:match("^%s*(.-)%s*$")
    local vOk, raw = pcall(function()
        return game:HttpGet(
            API_BASE .. "/api/key/check?userKey=" ..
            HttpService:UrlEncode(saved) ..
            "&scriptKey=" .. HttpService:UrlEncode(SCRIPT_KEY), true)
    end)
    if not vOk then return false end
    local pOk, data = pcall(function() return HttpService:JSONDecode(raw) end)
    if pOk and data and data.valid then
        task.spawn(function() loadstring(data.script)() end)
        return true
    end
    pcall(delfile, KEY_FILE)
    return false
end

if tryAutoVerify() then return end

-- Remove any existing key system GUI
pcall(function()
    if playerGui:FindFirstChild("_XeioaKS") then
        playerGui:FindFirstChild("_XeioaKS"):Destroy()
    end
end)

local screen = Instance.new("ScreenGui")
screen.Name = "_XeioaKS"
screen.ResetOnSpawn = false
screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screen.DisplayOrder = 999
screen.Parent = playerGui

local dim = Instance.new("Frame")
dim.Size = UDim2.fromScale(1, 1)
dim.BackgroundColor3 = Color3.new(0, 0, 0)
dim.BackgroundTransparency = 0.45
dim.BorderSizePixel = 0
dim.ZIndex = 1
dim.Parent = screen

local win = Instance.new("Frame")
win.Size = UDim2.new(0, 340, 0, 255)
win.Position = UDim2.new(0.5, -170, 0.5, -127)
win.BackgroundColor3 = Color3.fromRGB(14, 14, 24)
win.BorderSizePixel = 0
win.ZIndex = 2
win.Parent = screen

local winCorner = Instance.new("UICorner")
winCorner.CornerRadius = UDim.new(0, 14)
winCorner.Parent = win

local winStroke = Instance.new("UIStroke")
winStroke.Color = Color3.fromRGB(99, 102, 241)
winStroke.Thickness = 1
winStroke.Transparency = 0.65
winStroke.Parent = win

-- Title bar
local titleBar = Instance.new("Frame")
titleBar.Size = UDim2.new(1, 0, 0, 38)
titleBar.BackgroundColor3 = Color3.fromRGB(10, 10, 18)
titleBar.BorderSizePixel = 0
titleBar.ZIndex = 3
titleBar.Parent = win

local tbCorner = Instance.new("UICorner")
tbCorner.CornerRadius = UDim.new(0, 14)
tbCorner.Parent = titleBar

local tbFix = Instance.new("Frame")
tbFix.Size = UDim2.new(1, 0, 0, 8)
tbFix.Position = UDim2.new(0, 0, 1, -8)
tbFix.BackgroundColor3 = Color3.fromRGB(10, 10, 18)
tbFix.BorderSizePixel = 0
tbFix.ZIndex = 3
tbFix.Parent = titleBar

local titleIcon = Instance.new("TextLabel")
titleIcon.Size = UDim2.new(0, 22, 0, 22)
titleIcon.Position = UDim2.new(0, 10, 0.5, -11)
titleIcon.BackgroundTransparency = 1
titleIcon.Text = "\\240\\159\\155\\161"
titleIcon.TextSize = 15
titleIcon.ZIndex = 4
titleIcon.Parent = titleBar

local titleText = Instance.new("TextLabel")
titleText.Size = UDim2.new(1, -80, 1, 0)
titleText.Position = UDim2.new(0, 36, 0, 0)
titleText.BackgroundTransparency = 1
titleText.Text = DISPLAY_NAME .. " Key System"
titleText.TextColor3 = Color3.fromRGB(230, 230, 255)
titleText.TextSize = 13
titleText.Font = Enum.Font.GothamBold
titleText.TextXAlignment = Enum.TextXAlignment.Left
titleText.TextTruncate = Enum.TextTruncate.AtEnd
titleText.ZIndex = 4
titleText.Parent = titleBar

local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0, 22, 0, 22)
closeBtn.Position = UDim2.new(1, -30, 0.5, -11)
closeBtn.BackgroundColor3 = Color3.fromRGB(220, 50, 50)
closeBtn.Text = "X"
closeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
closeBtn.TextSize = 11
closeBtn.Font = Enum.Font.GothamBold
closeBtn.ZIndex = 5
closeBtn.Parent = titleBar

local closeBtnCorner = Instance.new("UICorner")
closeBtnCorner.CornerRadius = UDim.new(0, 6)
closeBtnCorner.Parent = closeBtn

closeBtn.MouseButton1Click:Connect(function()
    screen:Destroy()
end)

-- Body
local body = Instance.new("Frame")
body.Size = UDim2.new(1, 0, 1, -38)
body.Position = UDim2.new(0, 0, 0, 38)
body.BackgroundTransparency = 1
body.ZIndex = 3
body.Parent = win

local bodyLayout = Instance.new("UIListLayout")
bodyLayout.FillDirection = Enum.FillDirection.Vertical
bodyLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
bodyLayout.VerticalAlignment = Enum.VerticalAlignment.Center
bodyLayout.Padding = UDim.new(0, 7)
bodyLayout.Parent = body

local iconFrame = Instance.new("Frame")
iconFrame.Size = UDim2.new(0, 54, 0, 54)
iconFrame.BackgroundColor3 = Color3.fromRGB(22, 22, 52)
iconFrame.ZIndex = 4
iconFrame.Parent = body

local iconCorner = Instance.new("UICorner")
iconCorner.CornerRadius = UDim.new(0, 13)
iconCorner.Parent = iconFrame

local iconStroke = Instance.new("UIStroke")
iconStroke.Color = Color3.fromRGB(99, 102, 241)
iconStroke.Thickness = 1.5
iconStroke.Transparency = 0.4
iconStroke.Parent = iconFrame

local iconLabel = Instance.new("TextLabel")
iconLabel.Size = UDim2.fromScale(1, 1)
iconLabel.BackgroundTransparency = 1
iconLabel.Text = "\\240\\159\\155\\161"
iconLabel.TextSize = 26
iconLabel.TextXAlignment = Enum.TextXAlignment.Center
iconLabel.TextYAlignment = Enum.TextYAlignment.Center
iconLabel.ZIndex = 5
iconLabel.Parent = iconFrame

local mainTitle = Instance.new("TextLabel")
mainTitle.Size = UDim2.new(1, -20, 0, 20)
mainTitle.BackgroundTransparency = 1
mainTitle.Text = "Key Verification System"
mainTitle.TextColor3 = Color3.fromRGB(240, 240, 255)
mainTitle.TextSize = 15
mainTitle.Font = Enum.Font.GothamBold
mainTitle.ZIndex = 4
mainTitle.Parent = body

local subTitle = Instance.new("TextLabel")
subTitle.Size = UDim2.new(1, -20, 0, 14)
subTitle.BackgroundTransparency = 1
subTitle.Text = "Powered by " .. DISPLAY_NAME
subTitle.TextColor3 = Color3.fromRGB(120, 120, 155)
subTitle.TextSize = 11
subTitle.Font = Enum.Font.Gotham
subTitle.ZIndex = 4
subTitle.Parent = body

local inputBox = Instance.new("TextBox")
inputBox.Size = UDim2.new(1, -24, 0, 34)
inputBox.BackgroundColor3 = Color3.fromRGB(8, 8, 16)
inputBox.BorderSizePixel = 0
inputBox.PlaceholderText = "Enter your verification key"
inputBox.PlaceholderColor3 = Color3.fromRGB(85, 85, 110)
inputBox.Text = ""
inputBox.TextColor3 = Color3.fromRGB(220, 220, 245)
inputBox.TextSize = 12
inputBox.Font = Enum.Font.Gotham
inputBox.ClearTextOnFocus = false
inputBox.ZIndex = 4
inputBox.Parent = body

local inputCorner = Instance.new("UICorner")
inputCorner.CornerRadius = UDim.new(0, 8)
inputCorner.Parent = inputBox

local inputStroke = Instance.new("UIStroke")
inputStroke.Color = Color3.fromRGB(45, 45, 72)
inputStroke.Thickness = 1
inputStroke.Parent = inputBox

local btnRow = Instance.new("Frame")
btnRow.Size = UDim2.new(1, -24, 0, 36)
btnRow.BackgroundTransparency = 1
btnRow.ZIndex = 4
btnRow.Parent = body

local btnLayout = Instance.new("UIListLayout")
btnLayout.FillDirection = Enum.FillDirection.Horizontal
btnLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
btnLayout.Padding = UDim.new(0, 8)
btnLayout.Parent = btnRow

local getBtn = Instance.new("TextButton")
getBtn.Size = UDim2.new(0.5, -4, 1, 0)
getBtn.BackgroundColor3 = Color3.fromRGB(79, 70, 229)
getBtn.Text = "Get Link"
getBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
getBtn.TextSize = 13
getBtn.Font = Enum.Font.GothamBold
getBtn.ZIndex = 5
getBtn.Parent = btnRow

local getBtnCorner = Instance.new("UICorner")
getBtnCorner.CornerRadius = UDim.new(0, 9)
getBtnCorner.Parent = getBtn

local verifyBtn = Instance.new("TextButton")
verifyBtn.Size = UDim2.new(0.5, -4, 1, 0)
verifyBtn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
verifyBtn.Text = "Verify Key"
verifyBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
verifyBtn.TextSize = 13
verifyBtn.Font = Enum.Font.GothamBold
verifyBtn.ZIndex = 5
verifyBtn.Parent = btnRow

local verifyBtnCorner = Instance.new("UICorner")
verifyBtnCorner.CornerRadius = UDim.new(0, 9)
verifyBtnCorner.Parent = verifyBtn

local statusLabel = Instance.new("TextLabel")
statusLabel.Size = UDim2.new(1, -20, 0, 14)
statusLabel.BackgroundTransparency = 1
statusLabel.Text = ""
statusLabel.TextColor3 = Color3.fromRGB(120, 120, 155)
statusLabel.TextSize = 11
statusLabel.Font = Enum.Font.Gotham
statusLabel.ZIndex = 4
statusLabel.Parent = body

getBtn.MouseButton1Click:Connect(function()
    local ok = pcall(setclipboard, KEY_URL)
    if not ok then
        statusLabel.Text = "Open: " .. KEY_URL
        statusLabel.TextColor3 = Color3.fromRGB(150, 150, 255)
        return
    end
    local origText = getBtn.Text
    local origColor = getBtn.BackgroundColor3
    getBtn.Text = "Copied!"
    getBtn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
    task.delay(2.5, function()
        if getBtn and getBtn.Parent then
            getBtn.Text = origText
            getBtn.BackgroundColor3 = origColor
        end
    end)
end)

verifyBtn.MouseButton1Click:Connect(function()
    local userKey = inputBox.Text:match("^%s*(.-)%s*$") or ""
    if #userKey < 4 then
        statusLabel.Text = "Enter a valid key first"
        statusLabel.TextColor3 = Color3.fromRGB(239, 68, 68)
        return
    end

    verifyBtn.Text = "Checking..."
    verifyBtn.BackgroundColor3 = Color3.fromRGB(70, 70, 90)
    statusLabel.Text = ""

    task.spawn(function()
        local ok, raw = pcall(function()
            return game:HttpGet(
                API_BASE .. "/api/key/check?userKey=" ..
                HttpService:UrlEncode(userKey) ..
                "&scriptKey=" .. HttpService:UrlEncode(SCRIPT_KEY), true)
        end)

        if not ok then
            statusLabel.Text = "Connection failed - try again"
            statusLabel.TextColor3 = Color3.fromRGB(239, 68, 68)
            verifyBtn.Text = "Verify Key"
            verifyBtn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
            return
        end

        local pOk, data = pcall(function() return HttpService:JSONDecode(raw) end)

        if pOk and data and data.valid then
            statusLabel.Text = "Key accepted! Loading..."
            statusLabel.TextColor3 = Color3.fromRGB(34, 197, 94)
            verifyBtn.Text = "Loading..."
            pcall(writefile, KEY_FILE, userKey)
            task.delay(0.7, function()
                pcall(function()
                    screen:Destroy()
                    loadstring(data.script)()
                end)
            end)
        else
            local errMsg = (pOk and data and data.error) or "Invalid or expired key"
            statusLabel.Text = tostring(errMsg)
            statusLabel.TextColor3 = Color3.fromRGB(239, 68, 68)
            verifyBtn.Text = "Verify Key"
            verifyBtn.BackgroundColor3 = Color3.fromRGB(22, 163, 74)
        end
    end)
end)
`;
}
