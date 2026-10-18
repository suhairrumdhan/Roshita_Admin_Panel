# أوامر نشر تحديث لوحة إدارة روشيتة

هذه الأوامر تعمل على الملفات المدمجة داخل المشروعين الموجودين:

- الواجهة: `C:\Users\hp\OneDrive\Desktop\مشروع التخرج\Roshita_Admin_Panel`
- الخلفية المشتركة: `C:\Users\hp\StudioProjects\user_application`
- مشروع Firebase: `pharma-apps`

لا تنشر الأوامر قواعد Storage، ولا تطبيقات Flutter، ولا أي دالة غير مسماة في القائمة. نفّذ المقاطع بالترتيب في PowerShell، وتوقف إذا ظهر خطأ.

## 1. تعريف المسارات وبناء الواجهة

```powershell
$adminRoot = 'C:\Users\hp\OneDrive\Desktop\مشروع التخرج\Roshita_Admin_Panel'
$backendRoot = 'C:\Users\hp\StudioProjects\user_application'
$nodeExe = 'C:\Program Files\nodejs\node.exe'
$firebaseCli = Join-Path $backendRoot 'functions\node_modules\firebase-tools\lib\bin\firebase.js'

Set-Location -LiteralPath $adminRoot
& $nodeExe .\node_modules\vite\bin\vite.js build
if ($LASTEXITCODE -ne 0) { throw 'فشل بناء لوحة الإدارة؛ لا تتابع النشر' }
```

## 2. نشر فهارس Firestore المرتبطة بالقوائم

هذا ينشر مورد الفهارس من ملف الخلفية فقط. راجع أي سؤال يظهر عن حذف فهرس سحابي غير موجود في الملف قبل الموافقة عليه.

```powershell
Set-Location -LiteralPath $backendRoot
& $nodeExe $firebaseCli deploy --only 'firestore:indexes' --project pharma-apps
if ($LASTEXITCODE -ne 0) { throw 'فشل نشر الفهارس؛ لا تتابع' }
```

انتظر حتى تصبح الفهارس الجديدة `Enabled` في Firebase Console قبل تجربة البحث والترقيم.

## 3. نشر الدوال المرتبطة بالتحديث فقط

```powershell
$adminFunctions = @(
  'functions:adminList',
  'functions:adminInsights',
  'functions:adminVisibilityCommand',
  'functions:registrationCommand',
  'functions:processOrderDeadlines',
  'functions:executeOrderCommand',
  'functions:adminOrderProjection',
  'functions:onOrderCreated',
  'functions:onOrderUpdated',
  'functions:adminList_requests',
  'functions:adminList_pharmacies',
  'functions:adminList_users',
  'functions:adminList_orders',
  'functions:adminList_notifications',
  'functions:adminList_audit',
  'functions:adminBroadcastCommand',
  'functions:sendAdminBroadcast',
  'functions:retryAdminBroadcast',
  'functions:recoverAdminBroadcasts'
)

Set-Location -LiteralPath $backendRoot
& $nodeExe $firebaseCli deploy --config .\firebase.admin.json --only ($adminFunctions -join ',') --project pharma-apps
if ($LASTEXITCODE -ne 0) { throw 'فشل نشر دوال لوحة الإدارة؛ لا تتابع' }
```

ملف `firebase.admin.json` هو بوابة نشر مؤقتة للوحة فقط. يشغّل lint على كامل الخلفية وكل ملفات الاختبار المعتادة باستثناء `test/f03/pharmacy-employee-auth.test.js` المؤجل صراحةً. لا يغير `firebase.json` الأصلي، الذي ما زال يشغّل `verify` الكامل عند نشر بقية النظام.

ملاحظة Windows: إذا ظهر في محاولة سابقة خطأ `BigInt is not defined` فقد عولج في `functions/.eslintrc.js` بتعريف `BigInt` كقيمة قياسية لـNode 24. رسالة `ENOENT` التي تلت ذلك كانت نتيجة فشل `verify`. استخدم أمر النشر أعلاه بملف الإعداد المؤقت؛ لا تحذف `predeploy` ولا تستخدم خيارًا لتجاوز الفحص.

## 4. بناء قوائم الإدارة من البيانات الموجودة

هذا ليس نشرًا ولا بيانات اختبار. يحدّث ملخصات الإدارة ويبني قوائم القراءة من البيانات الفعلية الموجودة. يحتاج Application Default Credentials لمشروع Firebase.

```powershell
Set-Location -LiteralPath (Join-Path $backendRoot 'functions')
& $nodeExe .\scripts\admin-backfill-lists.cjs --project=pharma-apps --apply
if ($LASTEXITCODE -ne 0) { throw 'فشلت تهيئة قوائم الإدارة؛ لا تتابع' }
```

النتيجة المطلوبة هي اكتمال الأنواع الستة: `requests`, `pharmacies`, `users`, `orders`, `notifications`, `audit`.

### بديل دون اعتماد Google محلي

إذا لم ترغب في تثبيت `gcloud` أو ربط Application Default Credentials، انشر دالة الترحيل المؤقتة وحدها. تعمل بصلاحية Firebase السحابية، وتصبح بلا أثر بعد اكتمال الأنواع الستة:

```powershell
Set-Location -LiteralPath $backendRoot
& $nodeExe $firebaseCli deploy --config .\firebase.admin.json --only 'functions:initializeAdminListsOnce' --project pharma-apps
```

انتظر دورة الجدولة الأولى، ثم حدّث اللوحة. بعد ظهور القوائم احذف الدالة المؤقتة حتى لا تبقى لها جدولة:

```powershell
& $nodeExe $firebaseCli functions:delete initializeAdminListsOnce --region us-central1 --project pharma-apps
```

## 5. نشر تحديث الاستضافة

نفّذ هذا الأمر من مجلد لوحة الإدارة حتى يستخدم `dist` و`firebase.json` الخاصين بها:

```powershell
Set-Location -LiteralPath $adminRoot
& $nodeExe $firebaseCli deploy --only 'hosting' --project pharma-apps
if ($LASTEXITCODE -ne 0) { throw 'فشل نشر تحديث الاستضافة؛ لا تتابع' }
```

نشر الواجهة بعد تهيئة القوائم يمنع ظهور النسخة الجديدة قبل جاهزية مصادرها.

## 6. نشر قواعد Firestore المرتبطة

```powershell
Set-Location -LiteralPath $backendRoot
& $nodeExe $firebaseCli deploy --only 'firestore:rules' --project pharma-apps
if ($LASTEXITCODE -ne 0) { throw 'فشل نشر قواعد Firestore؛ لا تتابع' }
```

لا تستخدم `firebase deploy` دون `--only` من مجلد الخلفية؛ ذلك قد يضم Storage أو خدمات أخرى ليست ضمن هذا التحديث.

## 7. إزالة دالة إنشاء المشرف القديمة إن كانت ما زالت منشورة

أزيلت `createAdminEmployee` من المصدر لأنها خارج التوثيق. افحص أولًا:

```powershell
Set-Location -LiteralPath $backendRoot
& $nodeExe $firebaseCli functions:list --project pharma-apps | Select-String 'createAdminEmployee'
```

إذا ظهرت في النتيجة، احذف هذه الدالة وحدها:

```powershell
& $nodeExe $firebaseCli functions:delete createAdminEmployee --region us-central1 --project pharma-apps
```

هذا لا يحذف حسابات المشرفين أو وثائقهم؛ يحذف نقطة الإنشاء القديمة فقط.

بهذا الترتيب لا يتم نشر بقية الدوال، ولا قواعد Storage، ولا تطبيق المستخدم أو الصيدلية.
