// ===== 资源配置中心 =====
// 管理所有视频和图片资源的路径
// 通过 USE_CDN 开关一键切换：本地开发 ↔ Cloudflare R2 CDN 部署
//
// R2 上的文件目录结构与本地完全一致：
//   https://pub-a5d6a0984ff7419d9e1fb42127fbc43c.r2.dev/assets/images/cover/siyuan_lake.mp4
//                                           ↑ 与本地 assets/images/cover/siyuan_lake.mp4 一致

(function () {
    'use strict';

    // ============ 核心开关：是否使用 Cloudflare R2 CDN ============
    // 所有资源直接从 R2 CDN 加载
    const DEFAULT_USE_CDN = true;

    // ============ Cloudflare R2 CDN 基础 URL ============
    const CDN_BASE_URL = 'https://pub-a5d6a0984ff7419d9e1fb42127fbc43c.r2.dev';

    // ============ 资源路径配置 ============
    // 由于 R2 上的目录结构与本地完全一致（assets/images/...），
    // 我们直接使用 local 路径作为 cdn 路径，无需重复映射
    const ASSETS = {
        coverVideos: [
            'assets/images/cover/siyuan_lake.mp4',
            'assets/images/cover/temple_gate.mp4',
            'assets/images/cover/triumphal_arch.mp4'
        ],

        landmarkImages: [
            'assets/images/landmarks/siyuan_lake.png',
            'assets/images/landmarks/temple_gate.png',
            'assets/images/landmarks/triumphal_arch.png',
            'assets/images/landmarks/zhongyuan_corridor.png',
            'assets/images/landmarks/yinshui_siyuan_stele.png',
            'assets/images/landmarks/rose_garden.jpg',
            'assets/images/landmarks/botanical_garden.jpg',
            'assets/images/landmarks/centennial_eagle.jpg',
            'assets/images/landmarks/main_library_stairs.jpg',
            'assets/images/landmarks/dianyuan_lawn.jpg'
        ],

        classicPhotos: [
            'assets/images/poses/classic_photos/classic_1_empresses.png',
            'assets/images/poses/classic_photos/classic_1_please_sit.jpg',
            'assets/images/poses/classic_photos/classic_1_touch_face.jpg',
        ],

        soloFemalePoses: [
            'assets/images/poses/solo_female/solo_female_sit_head_tilt.png',
            'assets/images/poses/solo_female/solo_female_sit_book_head.png',
            'assets/images/poses/solo_female/solo_female_stand_point_up.png',
            'assets/images/poses/solo_female/solo_female_stand_throw_cap.png',
            'assets/images/poses/solo_female/solo_female_stand_hold_book.png',
            'assets/images/poses/solo_female/solo_female_stand_cross_arms.png',
            'assets/images/poses/solo_female/solo_female_stand_point_head.png',
            'assets/images/poses/solo_female/solo_female_stand_wave.png',
            'assets/images/poses/solo_female/solo_female_stand_faint.png',
            'assets/images/poses/solo_female/solo_female_stand_lean_rail.png',
            'assets/images/poses/solo_female/solo_female_squat_thumbs_up.png'
        ],

        groupPoses: [
            'assets/images/poses/group_mixed/group_6_stand_pyramid.png',
            'assets/images/poses/group_mixed/group_6_staircase.png',
            'assets/images/poses/group_mixed/group_6_run_field.png',
            'assets/images/poses/group_mixed/group_6_arm_wrestle.png',
            'assets/images/poses/group_mixed/group_4_stand_look_up.png',
            'assets/images/poses/group_mixed/group_4_stand_look_down_peace.png',
            'assets/images/poses/group_mixed/group_4_stand_corridor_run.png',
            'assets/images/poses/group_mixed/group_4_sit_photo.png',
            'assets/images/poses/group_mixed/group_4_sit_peace.png',
            'assets/images/poses/group_mixed/group_4_lie_cover_eyes.png'
        ]
    };

    // ============ 判断是否使用 CDN ============
    function shouldUseCDN() {
        // 允许用 URL 参数 ?use_cdn=0 临时禁用（调试用）
        const urlParams = new URLSearchParams(window.location.search);
        const urlParam = urlParams.get('use_cdn');
        if (urlParam === '0' || urlParam === 'false') {
            return false;
        }
        // 默认始终使用 Cloudflare R2 CDN
        return true;
    }

    // ============ 获取资源路径 ============
    function getPath(localPath) {
        if (!localPath) return '';

        const useCDN = shouldUseCDN();
        if (useCDN && CDN_BASE_URL) {
            return CDN_BASE_URL.replace(/\/$/, '') + '/' + localPath.replace(/^\//, '');
        }

        return localPath;
    }

    // ============ 便捷方法：获取封面视频列表 ============
    function getCoverVideos() {
        return ASSETS.coverVideos.map(function (path) { return getPath(path); });
    }

    // ============ 便捷方法：通过文件名获取任意资源路径 ============
    function getAsset(filename) {
        const allPaths = [].concat(
            ASSETS.coverVideos,
            ASSETS.landmarkImages,
            ASSETS.classicPhotos,
            ASSETS.soloFemalePoses,
            ASSETS.groupPoses
        );

        for (var i = 0; i < allPaths.length; i++) {
            if (allPaths[i].indexOf(filename) !== -1) {
                return getPath(allPaths[i]);
            }
        }

        return getPath(filename);
    }

    // ============ 便捷方法：解析本地路径 ============
    function resolvePath(localPath) {
        return getPath(localPath);
    }

    // ============ 暴露到全局 ============
    window.AssetConfig = {
        getCoverVideos: getCoverVideos,
        getAsset: getAsset,
        resolvePath: resolvePath,
        shouldUseCDN: shouldUseCDN,
        CDN_BASE_URL: CDN_BASE_URL,
        ASSETS: ASSETS
    };
})();
