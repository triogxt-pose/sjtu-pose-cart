# ======================================================================
#  包装器：解决中文路径问题
#  将项目内容复制到临时英文路径后执行检测，
#  把生成的 skeleton-templates.js 拷贝回项目目录。
# ======================================================================
import os
import shutil
import tempfile
import subprocess
import sys

# 项目根目录（此脚本所在目录）
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))

# 创建一个临时的纯英文路径目录
WORK_DIR = tempfile.mkdtemp(prefix="mp_train_")

print(f"[INFO] 项目目录: {PROJECT_DIR}")
print(f"[INFO] 临时工作目录: {WORK_DIR}")

# 需要复制的文件/目录
COPY_ITEMS = [
    ("models", "models"),
    ("assets", "assets"),
    ("train_skeleton.py", "train_skeleton.py"),
]

for src_name, dst_name in COPY_ITEMS:
    src = os.path.join(PROJECT_DIR, src_name)
    dst = os.path.join(WORK_DIR, dst_name)
    if os.path.exists(src):
        if os.path.isdir(src):
            print(f"[COPY] {src_name}/  → {WORK_DIR}/")
            shutil.copytree(src, dst)
        else:
            print(f"[COPY] {src_name}  → {WORK_DIR}/")
            shutil.copy2(src, dst)

# 修改 train_skeleton.py，使其使用 WORK_DIR
# 更简单：将 train_skeleton.py 中的 BASE_DIR 替换为 WORK_DIR
train_py = os.path.join(WORK_DIR, "train_skeleton.py")
with open(train_py, "r", encoding="utf-8") as f:
    content = f.read()

# 替换 BASE_DIR 为 WORK_DIR
content = content.replace(
    r'BASE_DIR = r"d:\我的文档\大学！\上交\学习\大一下\课内课程\人工智能基础\sjtu-pose-cart"',
    f'BASE_DIR = r"{WORK_DIR}"'
)

# 让脚本输出到当前项目目录
content = content.replace(
    'OUTPUT_PATH = os.path.join(BASE_DIR, "js", "skeleton-templates.js")',
    f'OUTPUT_PATH = r"{os.path.join(PROJECT_DIR, "js", "skeleton-templates.js")}"'
)

with open(train_py, "w", encoding="utf-8") as f:
    f.write(content)

print(f"[RUN] 在 {WORK_DIR} 运行 train_skeleton.py ...")
print("-" * 60)

# 运行
result = subprocess.run(
    [sys.executable, train_py],
    cwd=WORK_DIR,
    capture_output=False,
    text=True
)

print("-" * 60)

if result.returncode != 0:
    print(f"[ERROR] 检测脚本退出码 {result.returncode}")
    # 不立即删除，以便调试
    sys.exit(result.returncode)

# 验证输出
expected_js = os.path.join(PROJECT_DIR, "js", "skeleton-templates.js")
if os.path.exists(expected_js):
    print(f"[DONE] 生成成功: {expected_js} ({os.path.getsize(expected_js):,} 字节)")
else:
    print(f"[WARN] 预期输出文件不存在: {expected_js}")

# 清理临时目录
try:
    shutil.rmtree(WORK_DIR)
    print(f"[CLEAN] 临时目录已删除: {WORK_DIR}")
except Exception as e:
    print(f"[WARN] 临时目录清理失败: {e}")
