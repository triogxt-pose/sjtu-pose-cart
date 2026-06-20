import os
import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

BASE_DIR = r"d:\我的文档\大学！\上交\学习\大一下\课内课程\人工智能基础\sjtu-pose-cart"
IMG_DIR = os.path.join(BASE_DIR, "assets", "images", "poses", "classic_photos")
MODEL_DIR = os.path.join(BASE_DIR, "models")
OUTPUT_PATH = os.path.join(BASE_DIR, "js", "skeleton-templates.js")

HAND_MODEL = os.path.join(MODEL_DIR, "hand_landmarker.task")
FACE_MODEL = os.path.join(MODEL_DIR, "face_landmarker.task")

CLASSIC_IMAGES = [
    ("classic_1_empresses",      "甄嬛传单人",     1, "classic_1_empresses.png"),
    ("classic_2_wujing_xienan",  "吴京谢楠双人",   2, "classic_2_wujing_xienan.png"),
    ("classic_3_look_back",      "回头的诱惑三人", 3, "classic_3_look_back.png"),
    ("classic_3_exo",            "EXO三人",        3, "classic_3_exo.png"),
    ("classic_4_trump",          "特朗普四人",     4, "classic_4_trump.png"),
    ("classic_4_empresses",      "甄嬛传四人",     4, "classic_4_empresses.png"),
    ("classic_7_pro_team",       "专业团队七人",   7, "classic_7_pro_team.png"),
    ("classic_1_please_sit",     "请坐姿势单人",   1, "classic_1_please_sit.jpg"),
    ("classic_1_touch_face",     "向佐摸鼻梁单人",   1, "classic_1_touch_face.jpg"),
]

# 面部关键点索引：取脸轮廓 + 五官
FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
             397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
             172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
LEFT_BROW = [70, 63, 105, 66, 107]
RIGHT_BROW = [336, 296, 334, 293, 300]
NOSE = [168, 6, 197, 195, 5, 4, 1, 19, 94]
LIPS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185]
FACE_KEY_INDICES = sorted(set(FACE_OVAL + LEFT_EYE + RIGHT_EYE + LEFT_BROW + RIGHT_BROW + NOSE + LIPS))
print(f"[INFO] 面部关键点数量: {len(FACE_KEY_INDICES)} / 478")


def create_detectors():
    BaseOptions = mp_python.BaseOptions

    hand_options = vision.HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=HAND_MODEL),
        running_mode=vision.RunningMode.IMAGE,
        num_hands=20,
        min_hand_detection_confidence=0.05,
        min_hand_presence_confidence=0.03,
        min_tracking_confidence=0.03,
    )
    hand_detector = vision.HandLandmarker.create_from_options(hand_options)

    face_options = vision.FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=FACE_MODEL),
        running_mode=vision.RunningMode.IMAGE,
        num_faces=20,
        min_face_detection_confidence=0.08,
        min_face_presence_confidence=0.05,
        min_tracking_confidence=0.05,
        output_face_blendshapes=False,
        output_facial_transformation_matrixes=False,
    )
    face_detector = vision.FaceLandmarker.create_from_options(face_options)

    return hand_detector, face_detector


def detect_image(image_path, hand_det, face_det):
    img = cv2.imread(image_path)
    if img is None:
        print(f"  [ERROR] 无法读取: {image_path}")
        return [], []

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)

    hand_result = hand_det.detect(mp_img)
    face_result = face_det.detect(mp_img)

    hands = hand_result.hand_landmarks or []
    faces = face_result.face_landmarks or []

    return hands, faces


def associate_persons(hands, faces, expected_people):
    """将检测到的手和脸关联到人物，按脸质量排序，只保留 top-N"""
    used_hand_idx = set()

    # 1) 给每张脸打分：脸越大分数越高，有手部匹配加分
    face_scores = []
    for fi, face in enumerate(faces):
        fy_vals = [p.y for p in face]
        face_h = max(fy_vals) - min(fy_vals)
        fx = sum(p.x for p in face) / len(face)
        fy = sum(fy_vals) / len(fy_vals)

        # 数附近的手
        nearby_hands = 0
        for hi, hand in enumerate(hands):
            if hi in used_hand_idx:
                continue
            d = ((hand[0].x - fx) ** 2 + (hand[0].y - fy) ** 2) ** 0.5
            if d < max(face_h * 5, 0.4):
                nearby_hands += 1

        score = face_h * 10 + nearby_hands * 5
        face_scores.append((score, fi, fx, fy, face_h, nearby_hands))

    face_scores.sort(reverse=True)

    # 2) 只保留前 expected_people 张脸，优先匹配手
    persons = []
    for (score, fi, fx, fy, face_h, _) in face_scores[:expected_people]:
        face = faces[fi]
        person = {"handLeft": None, "handRight": None, "face": None}

        candidates = []
        for hi, hand in enumerate(hands):
            if hi in used_hand_idx:
                continue
            hx = hand[0].x
            hy = hand[0].y
            d = ((hx - fx) ** 2 + (hy - fy) ** 2) ** 0.5
            candidates.append((d, hi))
        candidates.sort()

        dist_thresh = max(face_h * 5, 0.4)
        matched_count = 0
        for (d, hi) in candidates:
            if matched_count >= 2:
                break
            if d < dist_thresh:
                if person["handLeft"] is None:
                    person["handLeft"] = [{"x": round(p.x, 4), "y": round(p.y, 4)} for p in hands[hi]]
                else:
                    person["handRight"] = [{"x": round(p.x, 4), "y": round(p.y, 4)} for p in hands[hi]]
                used_hand_idx.add(hi)
                matched_count += 1

        face_pts = []
        for idx in FACE_KEY_INDICES:
            if idx < len(face):
                p = face[idx]
                face_pts.append({"i": idx, "x": round(p.x, 4), "y": round(p.y, 4)})
        person["face"] = face_pts
        persons.append(person)

    # 3) 剩余未匹配的手，按距离配对成 hand-only person
    remaining_hands = [(hi, hands[hi]) for hi in range(len(hands)) if hi not in used_hand_idx]
    clustered = set()
    for i, (hi, hand_a) in enumerate(remaining_hands):
        if hi in clustered:
            continue
        ax = hand_a[0].x
        ay = hand_a[0].y
        best_j = -1
        best_d = 0.25
        for j, (hj, hand_b) in enumerate(remaining_hands):
            if i == j or hj in clustered:
                continue
            d = ((hand_b[0].x - ax) ** 2 + (hand_b[0].y - ay) ** 2) ** 0.5
            if d < best_d:
                best_d = d
                best_j = hj

        if best_j >= 0:
            person = {
                "handLeft": [{"x": round(p.x, 4), "y": round(p.y, 4)} for p in hand_a],
                "handRight": [{"x": round(p.x, 4), "y": round(p.y, 4)} for p in hands[best_j]],
                "face": None,
            }
            clustered.add(hi)
            clustered.add(best_j)
            persons.append(person)
        else:
            person = {
                "handLeft": [{"x": round(p.x, 4), "y": round(p.y, 4)} for p in hand_a],
                "handRight": None,
                "face": None,
            }
            clustered.add(hi)
            persons.append(person)

    # 最终按预期人数截断：优先保留有脸的 person，按质量从高到低
    persons_sorted = sorted(persons, key=lambda p: (0 if p.get("face") else 1, -len([k for k in ["handLeft", "handRight"] if p.get(k)])))
    return persons_sorted[:expected_people]


def format_person_js(person, indent=3):
    s = "    " * (indent + 1)
    lines = []

    if person.get("handLeft"):
        lines.append(f'{s}handLeft: [')
        for pt in person["handLeft"]:
            lines.append(f'{s}    {{ x: {pt["x"]}, y: {pt["y"]} }},')
        lines.append(f'{s}],')
    else:
        lines.append(f'{s}handLeft: null,')

    if person.get("handRight"):
        lines.append(f'{s}handRight: [')
        for pt in person["handRight"]:
            lines.append(f'{s}    {{ x: {pt["x"]}, y: {pt["y"]} }},')
        lines.append(f'{s}],')
    else:
        lines.append(f'{s}handRight: null,')

    if person.get("face"):
        lines.append(f'{s}face: [')
        for pt in person["face"]:
            lines.append(f'{s}    {{ i: {pt["i"]}, x: {pt["x"]}, y: {pt["y"]} }},')
        lines.append(f'{s}],')
    else:
        lines.append(f'{s}face: null,')

    return "\n".join(lines)


def main():
    if not os.path.exists(HAND_MODEL):
        print(f"[ERROR] 手部模型不存在: {HAND_MODEL}")
        return
    if not os.path.exists(FACE_MODEL):
        print(f"[ERROR] 面部模型不存在: {FACE_MODEL}")
        return
    print(f"[OK] 手部模型: {os.path.basename(HAND_MODEL)} ({os.path.getsize(HAND_MODEL)//1024}KB)")
    print(f"[OK] 面部模型: {os.path.basename(FACE_MODEL)} ({os.path.getsize(FACE_MODEL)//1024}KB)")
    print(f"[INFO] 图像目录: {IMG_DIR}")
    print(f"[INFO] 输出文件: {OUTPUT_PATH}")
    print()

    hand_det, face_det = create_detectors()
    print("[INFO] Hand + Face Landmarker 初始化完成")

    output_lines = []
    output_lines.append("// ======================================================")
    output_lines.append("//  经典照片骨架模板 - 手部 + 面部关键点")
    output_lines.append("//  生成方式: Python + MediaPipe Tasks API")
    output_lines.append("// ======================================================")
    output_lines.append("")
    output_lines.append("window.SKELETON_TEMPLATES = {")
    output_lines.append("")

    total_persons = 0
    total_hands = 0
    total_faces = 0

    for (key, name, people, filename) in CLASSIC_IMAGES:
        img_path = os.path.join(IMG_DIR, filename)
        print(f"[PROCESS] {name} ({filename}) - 期望 {people} 人")

        hands, faces = detect_image(img_path, hand_det, face_det)
        persons = associate_persons(hands, faces, people)

        num_persons = len(persons)
        num_hands = sum(
            (1 if p.get("handLeft") else 0) + (1 if p.get("handRight") else 0)
            for p in persons
        )
        num_faces = sum(1 for p in persons if p.get("face"))

        total_persons += num_persons
        total_hands += num_hands
        total_faces += num_faces

        print(f"  -> 原始检测: 手={len(hands)}, 脸={len(faces)}")
        print(f"  -> 组装后: {num_persons}人, {num_hands}只手, {num_faces}张脸")

        output_lines.append(f"    '{key}': {{")
        output_lines.append(f"        people: {people},")
        output_lines.append(f"        description: '{name}',")
        output_lines.append(f"        persons: [")

        if persons:
            for idx, p in enumerate(persons):
                output_lines.append(f"            {{ // 人物 {idx+1}")
                output_lines.append(format_person_js(p, indent=3))
                output_lines.append("            },")

        output_lines.append("        ],")
        output_lines.append("    },")
        output_lines.append("")

    output_lines.append("};")
    output_lines.append("")

    output_text = "\n".join(output_lines)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(output_text)

    print()
    print(f"[DONE] 总计: {total_persons}人, {total_hands}只手, {total_faces}张脸")
    print(f"[DONE] 文件已保存: {OUTPUT_PATH}")
    print(f"[DONE] 文件大小: {os.path.getsize(OUTPUT_PATH):,} 字节")

    try:
        hand_det.close()
        face_det.close()
    except Exception:
        pass


if __name__ == "__main__":
    main()