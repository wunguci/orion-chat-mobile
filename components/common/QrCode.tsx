import React, { useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';

declare const require: any;

const QRCodeGenerator = require('qrcode-terminal/vendor/QRCode');
const QRErrorCorrectLevel = require('qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel');

type QrCodeProps = {
    value: string;
    size?: number;
    quietZone?: number;
    foregroundColor?: string;
    backgroundColor?: string;
};

const createMatrix = (value: string): boolean[][] => {
    const qr = new QRCodeGenerator(-1, QRErrorCorrectLevel.M);
    qr.addData(value);
    qr.make();
    return qr.modules as boolean[][];
};

export function QrCode({
    value,
    size = 220,
    quietZone = 4,
    foregroundColor = '#111827',
    backgroundColor = '#ffffff',
}: QrCodeProps) {
    const matrix = useMemo(() => createMatrix(value), [value]);
    const moduleCount = matrix.length;
    const viewBoxSize = moduleCount + quietZone * 2;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
            <Rect width={viewBoxSize} height={viewBoxSize} fill={backgroundColor} />
            {matrix.map((row, rowIndex) =>
                row.map((isDark, colIndex) =>
                    isDark ? (
                        <Rect
                            key={`${rowIndex}-${colIndex}`}
                            x={colIndex + quietZone}
                            y={rowIndex + quietZone}
                            width={1}
                            height={1}
                            fill={foregroundColor}
                        />
                    ) : null,
                ),
            )}
        </Svg>
    );
}
