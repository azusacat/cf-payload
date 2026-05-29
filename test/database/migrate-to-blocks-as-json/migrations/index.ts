import * as migration_20260529_151954 from './20260529_151954'
import * as migration_20260529_151958_blocks_as_json from './20260529_151958_blocks_as_json'

export const migrations = [
  {
    up: migration_20260529_151954.up,
    down: migration_20260529_151954.down,
    name: '20260529_151954',
  },
  {
    up: migration_20260529_151958_blocks_as_json.up,
    down: migration_20260529_151958_blocks_as_json.down,
    name: '20260529_151958_blocks_as_json',
  },
]
