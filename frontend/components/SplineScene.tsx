"use client"
import Spline from '@splinetool/react-spline'

export default function SplineScene({ onLoad }: { onLoad?: () => void }) {
    return (
        <Spline
            scene="https://prod.spline.design/zldL4w5lqdP03ihP/scene.splinecode"
            onLoad={onLoad}
        />
    )
}
