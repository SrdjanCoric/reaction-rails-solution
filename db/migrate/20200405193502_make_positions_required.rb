class MakePositionsRequired < ActiveRecord::Migration[6.0]
  def change
    change_column_null :lists, :position, false
    change_column_null :cards, :position, false
  end
end
