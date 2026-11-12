/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * JitCompiler: Real-Time x86-64 / ARM / Hardware JIT Engine
 * Compiles low-level assembly, memory poke/peek, bitwise operations,
 * and hardware register mutations with zero artificial fluff.
 */

import { HardwareMetrics, RegisterState, BitSwitchState, MalwareEntity, GameZone } from '../types/game';
import { hardwareAudio } from '../audio/HardwareAudio';

export interface CompileResult {
  success: boolean;
  stdout: string;
  stderr?: string;
  compileTimeMs: number;
  tempDelta: number;
  voltageSpike: boolean;
  unlockedLaser?: boolean;
  bridgeAligned?: boolean;
  malwareKilledId?: string;
  updatedRegisters?: Partial<RegisterState>;
  updatedBits?: number[];
}

export class JitCompiler {
  public static compileAndExecute(
    rawCode: string,
    currentZone: GameZone,
    registers: RegisterState,
    bitSwitchState: BitSwitchState,
    malwareList: MalwareEntity[]
  ): CompileResult {
    const startTime = performance.now();
    const trimmed = rawCode.trim();

    if (!trimmed) {
      return {
        success: false,
        stdout: '',
        stderr: 'ERR_EMPTY_INSTRUCTION: No machine code or assembly mnemonic provided.',
        compileTimeMs: 0.05,
        tempDelta: 2,
        voltageSpike: false,
      };
    }

    const tokens = trimmed.split(/[\s,]+/).filter(Boolean);
    const opcode = tokens[0].toUpperCase();

    // 1. HELP / ARCH / INFO
    if (opcode === 'HELP' || opcode === 'ARCH' || opcode === 'MAN') {
      const manual = [
        '=== ENES ENGINE v26.0 (VULKAN-RT NATIVE ARCHITECT KERNEL) ===',
        'AUTHOR: Enes Öztürk | ARCH: x86-64 / ARM64 JIT COMPILER',
        'AVAILABLE LOW-LEVEL DIRECTIVES:',
        '  • POKE <addr> <hex>       : Direct memory write (e.g. POKE 0x7FFF00A1 0x9090)',
        '  • PEEK <addr>             : Inspect memory address (e.g. PEEK 0x7FFF00A1)',
        '  • MOV <reg>, <hex_val>    : Write 64-bit register (e.g. MOV RAX 0xFF)',
        '  • XOR <reg>, <reg>        : Clear/toggle register (e.g. XOR RAX RAX)',
        '  • SHL <8bits> <count>     : Bitwise Shift Left (e.g. SHL 01101100 2)',
        '  • SHR <8bits> <count>     : Bitwise Shift Right (e.g. SHR 10110000 2)',
        '  • AND/OR/XOR <b1> <b2>    : Logical bitwise operations',
        '  • SET BIT <index> <0|1>   : Set individual bit 0-7 (e.g. SET BIT 7 1)',
        '  • PATCH <addr> NOP        : Neutralize malware or gate at address',
        '  • KILL -9 <addr>          : Terminate daemon at memory address',
        '  • DMESG                   : Inspect hardware kernel messages',
      ].join('\n');

      return {
        success: true,
        stdout: manual,
        compileTimeMs: performance.now() - startTime,
        tempDelta: 0.5,
        voltageSpike: false,
      };
    }

    // 2. DMESG
    if (opcode === 'DMESG') {
      return {
        success: true,
        stdout: [
          '[    0.000000] Linux version 6.12.0-enes-engine-vulkan (enes@quantum-core) #1 SMP PREEMPT',
          '[    0.000004] Command line: BOOT_IMAGE=/vmlinuz root=UUID=7fff00a1-0000 ro quiet',
          '[    0.000120] x86/fpu: Supporting XSAVE feature 0x001: \'x87 floating point registers\'',
          '[    0.000450] CPU0: Enes Core-X (family: 0x19, model: 0x21, stepping: 0x02)',
          '[    0.001200] smpboot: CPU0: 64-bit mode enabled; Instruction Pointer RIP locked.',
          '[    0.008900] [BARRIER_LOCKED] 0x7FFF00A1 : Memory fence active. Laser array armed.',
        ].join('\n'),
        compileTimeMs: performance.now() - startTime,
        tempDelta: 1,
        voltageSpike: false,
      };
    }

    // 3. POKE: Memory Write (Critical for Laser Barrier 0x7FFF00A1)
    if (opcode === 'POKE' || opcode === 'WRITE') {
      if (tokens.length < 3) {
        return this.syntaxError('SYNTAX ERROR: Expected "POKE <ADDRESS> <HEX_VALUE>"');
      }
      const addr = tokens[1].toUpperCase();
      const val = tokens[2].toUpperCase();

      if (!addr.startsWith('0X') || isNaN(parseInt(addr, 16))) {
        return this.syntaxError(`SIGSEGV: Invalid memory address syntax "${addr}". Expected format "0x7FFF00A1".`);
      }

      // Check if targeting Laser Barrier: 0x7FFF00A1
      if (addr.includes('7FFF00A1') || addr === '0x7FFF00A1') {
        // Any NOP (0x90, 0x9090) or Zero (0x00, 0x00000000) disables laser!
        if (val === '0X90' || val === '0X9090' || val === '0X00' || val === '0X00000000' || val === 'NOP') {
          return {
            success: true,
            stdout: `[JIT COMPILATION OK: 0.14ms]\n*reinterpret_cast<volatile uint32_t*>(${addr}) = ${val};\n>>> MEMORY FENCE OVERRIDDEN! Physical laser barrier 0x7FFF00A1 offline. Path cleared!`,
            compileTimeMs: performance.now() - startTime,
            tempDelta: -4,
            voltageSpike: false,
            unlockedLaser: true,
          };
        } else {
          return {
            success: true,
            stdout: `[JIT COMPILED]\nWrote ${val} to ${addr}. Barrier registers did not neutralize. Try writing NOP (0x9090) or 0x00.`,
            compileTimeMs: performance.now() - startTime,
            tempDelta: 2,
            voltageSpike: false,
          };
        }
      }

      return {
        success: true,
        stdout: `[JIT COMPILED]\nPOKE ${addr} = ${val}. Memory page committed.`,
        compileTimeMs: performance.now() - startTime,
        tempDelta: 1,
        voltageSpike: false,
      };
    }

    // 4. PEEK: Memory Inspect
    if (opcode === 'PEEK' || opcode === 'READ') {
      if (tokens.length < 2) {
        return this.syntaxError('SYNTAX ERROR: Expected "PEEK <ADDRESS>"');
      }
      const addr = tokens[1].toUpperCase();
      if (addr.includes('7FFF00A1')) {
        return {
          success: true,
          stdout: `[0x7FFF00A1] = 0xDEADBEEF (LASER_BARRIER_GATE: ARMED)\nDisassembly: JMP 0x7FFF00A1 (INFINITE LOCK)\nRecommendation: POKE 0x7FFF00A1 0x9090 (NOP)`,
          compileTimeMs: performance.now() - startTime,
          tempDelta: 0.5,
          voltageSpike: false,
        };
      }
      return {
        success: true,
        stdout: `[${addr}] = 0x00FF4C80 (RAW BYTES)`,
        compileTimeMs: performance.now() - startTime,
        tempDelta: 0.5,
        voltageSpike: false,
      };
    }

    // 5. MOV: Register Manipulation (MOV RAX, 0xFF)
    if (opcode === 'MOV') {
      if (tokens.length < 3) {
        return this.syntaxError('SYNTAX ERROR: Expected "MOV <REGISTER> <VALUE>"');
      }
      const reg = tokens[1].toUpperCase();
      const valStr = tokens[2];
      const validRegs = ['RAX', 'RBX', 'RCX', 'RDX', 'RSP', 'RBP', 'RSI', 'RDI', 'RIP'];
      if (!validRegs.includes(reg)) {
        return this.syntaxError(`INVALID REGISTER: "${reg}". Valid registers: ${validRegs.join(', ')}`);
      }

      let parsedVal = 0;
      if (valStr.toUpperCase().startsWith('0X')) {
        parsedVal = parseInt(valStr, 16);
      } else {
        parsedVal = parseInt(valStr, 10);
      }

      if (isNaN(parsedVal)) {
        return this.syntaxError(`INVALID IMMEDIATE VALUE: "${valStr}".`);
      }

      return {
        success: true,
        stdout: `[JIT COMPILED: 0.08ms]\nmov %${reg.toLowerCase()}, ${valStr}\n>>> Register %${reg} updated to 0x${parsedVal.toString(16).toUpperCase()}`,
        compileTimeMs: performance.now() - startTime,
        tempDelta: 1.5,
        voltageSpike: false,
        updatedRegisters: {
          [reg]: parsedVal,
        },
      };
    }

    // 6. XOR: XOR RAX, RAX (Common idiom to clear register)
    if (opcode === 'XOR') {
      if (tokens.length < 3) {
        return this.syntaxError('SYNTAX ERROR: Expected "XOR <REG>, <REG>"');
      }
      const r1 = tokens[1].toUpperCase();
      const r2 = tokens[2].toUpperCase();
      if (r1 === r2) {
        return {
          success: true,
          stdout: `[JIT COMPILED: 0.04ms]\nxor %${r1.toLowerCase()}, %${r2.toLowerCase()}\n>>> Register %${r1} zeroed out (0x0000000000000000). ZF=1.`,
          compileTimeMs: performance.now() - startTime,
          tempDelta: 0.5,
          voltageSpike: false,
          updatedRegisters: {
            [r1]: 0,
          },
        };
      }
    }

    // 7. BITWISE SHIFT LEFT (SHL) e.g. SHL 01101100 2 -> 10110000 (Solves 8-Bit Bus Bridge!)
    if (opcode === 'SHL' || opcode === 'SAL') {
      if (tokens.length < 3) {
        return this.syntaxError('SYNTAX ERROR: Expected "SHL <8_BIT_PATTERN> <SHIFT_COUNT>" e.g. "SHL 01101100 2"');
      }
      const bitStr = tokens[1];
      const shiftCount = parseInt(tokens[2], 10);

      if (!/^[01]{8}$/.test(bitStr)) {
        return this.syntaxError(`BITWISE ERROR: Expected 8-bit binary string (e.g. 01101100), received "${bitStr}".`);
      }
      if (isNaN(shiftCount) || shiftCount < 1 || shiftCount > 7) {
        return this.syntaxError(`BITWISE ERROR: Shift count must be between 1 and 7.`);
      }

      const num = parseInt(bitStr, 2);
      const shifted = (num << shiftCount) & 0xFF; // keep 8-bit
      const shiftedBin = shifted.toString(2).padStart(8, '0');
      const shiftedArray = shiftedBin.split('').map((c) => parseInt(c, 10));

      const isTarget = shiftedBin === '10110000';

      return {
        success: true,
        stdout: [
          `[ALU BITWISE JIT OK: 0.09ms]`,
          `INPUT : ${bitStr} (0x${num.toString(16).toUpperCase()})`,
          `SHL   : << ${shiftCount}`,
          `OUTPUT: ${shiftedBin} (0x${shifted.toString(16).toUpperCase()})`,
          isTarget
            ? `>>> CRITICAL BUS ALIGNMENT MATCH: 10110000! Quantum bridge slabs locked in place!`
            : `>>> Bridge pattern did not match target 10110000 (0xB0).`,
        ].join('\n'),
        compileTimeMs: performance.now() - startTime,
        tempDelta: 2,
        voltageSpike: false,
        updatedBits: shiftedArray,
        bridgeAligned: isTarget,
      };
    }

    // 8. BITWISE SHIFT RIGHT (SHR)
    if (opcode === 'SHR' || opcode === 'SAR') {
      if (tokens.length < 3) {
        return this.syntaxError('SYNTAX ERROR: Expected "SHR <8_BIT_PATTERN> <SHIFT_COUNT>"');
      }
      const bitStr = tokens[1];
      const shiftCount = parseInt(tokens[2], 10);
      if (!/^[01]{8}$/.test(bitStr)) {
        return this.syntaxError('BITWISE ERROR: Expected 8-bit binary string.');
      }
      const num = parseInt(bitStr, 2);
      const shifted = (num >> shiftCount) & 0xFF;
      const shiftedBin = shifted.toString(2).padStart(8, '0');
      const shiftedArray = shiftedBin.split('').map((c) => parseInt(c, 10));

      return {
        success: true,
        stdout: `[ALU BITWISE JIT OK]\n${bitStr} >> ${shiftCount} = ${shiftedBin}`,
        compileTimeMs: performance.now() - startTime,
        tempDelta: 1,
        voltageSpike: false,
        updatedBits: shiftedArray,
        bridgeAligned: shiftedBin === '10110000',
      };
    }

    // 9. SET BIT <index> <0|1>
    if (opcode === 'SET' && tokens[1]?.toUpperCase() === 'BIT') {
      if (tokens.length < 4) {
        return this.syntaxError('SYNTAX ERROR: Expected "SET BIT <0-7> <0|1>"');
      }
      const bitIndex = parseInt(tokens[2], 10);
      const bitVal = parseInt(tokens[3], 10);
      if (isNaN(bitIndex) || bitIndex < 0 || bitIndex > 7) {
        return this.syntaxError('BIT ERROR: Bit index must be 0 to 7.');
      }
      if (bitVal !== 0 && bitVal !== 1) {
        return this.syntaxError('BIT ERROR: Bit value must be 0 or 1.');
      }

      const newBits = [...bitSwitchState.bits];
      newBits[7 - bitIndex] = bitVal;
      const binStr = newBits.join('');
      const isTarget = binStr === '10110000';

      return {
        success: true,
        stdout: `[BUS TOGGLE]\nBit ${bitIndex} set to ${bitVal}. Current 8-bit bus word: ${binStr}\n${isTarget ? '>>> BUS BRIDGE ALIGNED!' : ''}`,
        compileTimeMs: performance.now() - startTime,
        tempDelta: 1,
        voltageSpike: false,
        updatedBits: newBits,
        bridgeAligned: isTarget,
      };
    }

    // 10. PATCH / KILL / FREE (For neutralizing malware in L3 cache matrix)
    if (opcode === 'PATCH' || opcode === 'KILL' || opcode === 'FREE') {
      const target = tokens.slice(1).join(' ').toUpperCase();
      const matched = malwareList.find(
        (m) =>
          !m.isNeutralized &&
          (target.includes(m.address.toUpperCase()) ||
            target.includes(m.id.toUpperCase()) ||
            target.includes('L3') ||
            target.includes('0XBAD') ||
            target.includes('MALWARE'))
      );

      if (matched) {
        return {
          success: true,
          stdout: `[SIGKILL 0x${matched.address}]\n>>> Process '${matched.name}' neutralized!\nFreeing allocated cache lines. Memory corruption restored.`,
          compileTimeMs: performance.now() - startTime,
          tempDelta: -3,
          voltageSpike: false,
          malwareKilledId: matched.id,
        };
      } else {
        return {
          success: true,
          stdout: `[DAEMON SEARCH]\nNo active unpatched daemon found matching "${target}". Check L3 Cache Tag list.`,
          compileTimeMs: performance.now() - startTime,
          tempDelta: 1,
          voltageSpike: false,
        };
      }
    }

    // 11. UNRECOGNIZED SYNTAX -> Explode terminal & overheat!
    return this.syntaxError(
      `C++26 JIT PARSE ERROR: Unknown token or undefined mnemonic "${trimmed}".\nHardware compilation pipeline broke at instruction pointer 0x00007FFF.`
    );
  }

  private static syntaxError(msg: string): CompileResult {
    hardwareAudio.playSyntaxErrorSpark();
    return {
      success: false,
      stdout: '',
      stderr: `[SYNTAX ERROR - HARDWARE FAULT]\n${msg}\n>>> CRITICAL: JIT thermal spike (+16°C)! VRM voltage oscillation!`,
      compileTimeMs: 0.08,
      tempDelta: 16,
      voltageSpike: true,
    };
  }
}
